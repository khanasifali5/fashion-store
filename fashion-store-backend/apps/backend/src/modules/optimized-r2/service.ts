import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { FileTypes, Logger } from "@medusajs/framework/types"
import {
  AbstractFileProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import { spawn } from "child_process"
import { createWriteStream } from "fs"
import {
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "fs/promises"
import os from "os"
import path from "path"
import sharp from "sharp"
import { PassThrough, Readable, Writable } from "stream"
import { ulid } from "ulid"

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  file_url: string
  access_key_id: string
  secret_access_key: string
  region: string
  bucket: string
  endpoint: string
}

type OptimizedFile = {
  buffer: Buffer
  mimeType?: string
  extension?: string
  decision?: string
}

type VideoProbe = {
  codecName?: string
  width?: number
  height?: number
}

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

const VIDEO_MIN_SAVING_RATIO = 0.1

const FFMPEG_BIN =
  process.env.FFMPEG_PATH || "ffmpeg"

const FFPROBE_BIN =
  process.env.FFPROBE_PATH || "ffprobe"

function decodeContent(
  content: string,
  mimeType?: string
): Buffer {
  const decoded = Buffer.from(
    content,
    "base64"
  )

  if (
    decoded.toString("base64") ===
    content
  ) {
    return decoded
  }

  const isText =
    mimeType?.startsWith("text/") ||
    mimeType?.includes("csv") ||
    mimeType?.includes("json") ||
    mimeType?.includes("xml")

  return isText
    ? Buffer.from(
        content,
        "utf8"
      )
    : Buffer.from(
        content,
        "binary"
      )
}

function sanitizeFilename(
  filename: string
): string {
  return path
    .basename(filename)
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-"
    )
}

function publicUrl(
  base: string,
  key: string
): string {
  const encoded = key
    .split("/")
    .map(encodeURIComponent)
    .join("/")

  return `${base.replace(/\/$/, "")}/${encoded}`
}

function isVideoMime(
  mimeType?: string
): boolean {
  return Boolean(
    mimeType
      ?.toLowerCase()
      .startsWith("video/")
  )
}

function isMp4Input(
  filename: string,
  mimeType?: string
): boolean {
  return (
    path
      .extname(filename)
      .toLowerCase() ===
      ".mp4" ||
    mimeType?.toLowerCase() ===
      "video/mp4"
  )
}

function safeInputExtension(
  filename: string
): string {
  const ext = path
    .extname(filename)
    .toLowerCase()

  if (
    ext &&
    /^\.[a-z0-9]{1,10}$/.test(
      ext
    )
  ) {
    return ext
  }

  return ".bin"
}

function runProcess(
  command: string,
  args: string[]
): Promise<{
  stdout: string
  stderr: string
}> {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const child = spawn(
        command,
        args,
        {
          windowsHide: true,
        }
      )

      let stdout = ""
      let stderr = ""

      child.stdout.on(
        "data",
        (chunk) => {
          stdout +=
            chunk.toString()
        }
      )

      child.stderr.on(
        "data",
        (chunk) => {
          stderr +=
            chunk.toString()

          if (
            stderr.length >
            200_000
          ) {
            stderr =
              stderr.slice(
                -200_000
              )
          }
        }
      )

      child.on(
        "error",
        (error: any) => {
          if (
            error?.code ===
            "ENOENT"
          ) {
            reject(
              new Error(
                `${command} was not found. Install FFmpeg and make sure "${command}" is available in PATH.`
              )
            )
            return
          }

          reject(error)
        }
      )

      child.on(
        "close",
        (code) => {
          if (code === 0) {
            resolve({
              stdout,
              stderr,
            })
            return
          }

          reject(
            new Error(
              `${command} exited with code ${code}. ${stderr
                .trim()
                .slice(-4000)}`
            )
          )
        }
      )
    }
  )
}

async function probeVideo(
  inputPath: string
): Promise<VideoProbe> {
  const result =
    await runProcess(
      FFPROBE_BIN,
      [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=codec_name,width,height",
        "-of",
        "json",
        inputPath,
      ]
    )

  const parsed =
    JSON.parse(
      result.stdout || "{}"
    )

  const stream =
    parsed?.streams?.[0]

  if (!stream) {
    throw new Error(
      "No video stream was found in the uploaded file."
    )
  }

  return {
    codecName:
      typeof stream.codec_name ===
      "string"
        ? stream.codec_name
        : undefined,
    width:
      Number.isFinite(
        Number(stream.width)
      )
        ? Number(
            stream.width
          )
        : undefined,
    height:
      Number.isFinite(
        Number(stream.height)
      )
        ? Number(
            stream.height
          )
        : undefined,
  }
}

function getTargetSize(
  width?: number,
  height?: number
): {
  width: number
  height: number
} | null {
  if (
    !width ||
    !height ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }

  const scale = Math.min(
    1,
    1920 / width,
    1080 / height
  )

  if (scale >= 1) {
    return null
  }

  const targetWidth =
    Math.max(
      2,
      Math.floor(
        (width * scale) /
          2
      ) * 2
    )

  const targetHeight =
    Math.max(
      2,
      Math.floor(
        (height * scale) /
          2
      ) * 2
    )

  return {
    width:
      targetWidth,
    height:
      targetHeight,
  }
}

async function optimizeImage(
  input: Buffer,
  mimeType?: string
): Promise<OptimizedFile> {
  if (
    !mimeType ||
    !IMAGE_TYPES.has(
      mimeType.toLowerCase()
    )
  ) {
    return {
      buffer:
        input,
      mimeType,
      extension:
        undefined,
    }
  }

  const metadata =
    await sharp(
      input,
      {
        failOn:
          "none",
      }
    ).metadata()

  const quality =
    metadata.hasAlpha
      ? 90
      : 86

  const buffer =
    await sharp(
      input,
      {
        failOn:
          "none",
      }
    )
      .rotate()
      .resize({
        width:
          2000,
        height:
          2000,
        fit:
          "inside",
        withoutEnlargement:
          true,
      })
      .webp({
        quality,
        alphaQuality:
          100,
        effort:
          4,
        smartSubsample:
          true,
      })
      .toBuffer()

  return {
    buffer,
    mimeType:
      "image/webp",
    extension:
      ".webp",
  }
}

async function optimizeVideoFromPath(
  inputPath: string,
  originalSize: number,
  originalFilename: string,
  originalMimeType?: string
): Promise<OptimizedFile> {
  const probe =
    await probeVideo(
      inputPath
    )

  const tempDir =
    path.dirname(
      inputPath
    )

  const outputPath =
    path.join(
      tempDir,
      `optimized-${ulid()}.mp4`
    )

  const args = [
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a?",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "21",
    "-pix_fmt",
    "yuv420p",
  ]

  const target =
    getTargetSize(
      probe.width,
      probe.height
    )

  if (target) {
    args.push(
      "-vf",
      `scale=${target.width}:${target.height}`
    )
  }

  args.push(
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    outputPath
  )

  await runProcess(
    FFMPEG_BIN,
    args
  )

  const optimizedStat =
    await stat(
      outputPath
    )

  if (
    optimizedStat.size <= 0
  ) {
    throw new Error(
      "FFmpeg produced an empty video file."
    )
  }

  const originalIsCompatible =
    probe.codecName
      ?.toLowerCase() ===
      "h264" &&
    isMp4Input(
      originalFilename,
      originalMimeType
    )

  const savingRatio =
    originalSize > 0
      ? 1 -
        optimizedStat.size /
          originalSize
      : 0

  /*
   * Quality-first rule:
   * If the original is already H.264 MP4 and FFmpeg saves
   * less than 10%, keep the original untouched.
   *
   * If the input isn't H.264 MP4, always use the generated
   * H.264 MP4 for broad web compatibility.
   */
  if (
    originalIsCompatible &&
    savingRatio <
      VIDEO_MIN_SAVING_RATIO
  ) {
    const originalBuffer =
      await readFile(
        inputPath
      )

    return {
      buffer:
        originalBuffer,
      mimeType:
        "video/mp4",
      extension:
        ".mp4",
      decision:
        `kept original H.264 MP4 because saving was ${(savingRatio * 100).toFixed(1)}% (< 10%)`,
    }
  }

  const optimizedBuffer =
    await readFile(
      outputPath
    )

  return {
    buffer:
      optimizedBuffer,
    mimeType:
      "video/mp4",
    extension:
      ".mp4",
    decision:
      originalIsCompatible
        ? `used optimized H.264 MP4 with ${(savingRatio * 100).toFixed(1)}% saving`
        : `converted to web-compatible H.264 MP4 with ${(savingRatio * 100).toFixed(1)}% size change`,
  }
}

async function optimizeVideoBuffer(
  input: Buffer,
  filename: string,
  mimeType?: string
): Promise<OptimizedFile> {
  const tempDir =
    await mkdtemp(
      path.join(
        os.tmpdir(),
        "safafi-video-"
      )
    )

  const inputPath =
    path.join(
      tempDir,
      `input${safeInputExtension(
        filename
      )}`
    )

  try {
    await writeFile(
      inputPath,
      input
    )

    return await optimizeVideoFromPath(
      inputPath,
      input.length,
      filename,
      mimeType
    )
  } finally {
    await rm(
      tempDir,
      {
        recursive:
          true,
        force:
          true,
      }
    ).catch(
      () => undefined
    )
  }
}

class OptimizedR2FileService extends AbstractFileProviderService {
  static identifier =
    "optimized-r2"

  protected logger_: Logger
  protected options_: Options
  protected client_: S3Client

  constructor(
    {
      logger,
    }: InjectedDependencies,
    options: Options
  ) {
    super()

    this.logger_ =
      logger
    this.options_ =
      options
    this.client_ =
      new S3Client({
        region:
          options.region,
        endpoint:
          options.endpoint,
        credentials: {
          accessKeyId:
            options.access_key_id,
          secretAccessKey:
            options.secret_access_key,
        },
      })
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (
      !file?.filename
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No filename provided"
      )
    }

    const original =
      decodeContent(
        file.content,
        file.mimeType
      )

    let optimized:
      OptimizedFile

    if (
      isVideoMime(
        file.mimeType
      )
    ) {
      optimized =
        await optimizeVideoBuffer(
          original,
          file.filename,
          file.mimeType
        )
    } else {
      optimized =
        await optimizeImage(
          original,
          file.mimeType
        )
    }

    const cleanName =
      sanitizeFilename(
        file.filename
      )

    const parsed =
      path.parse(
        cleanName
      )

    const extension =
      optimized.extension ??
      parsed.ext

    const key =
      `${parsed.name}-${ulid()}${extension}`

    await this.client_.send(
      new PutObjectCommand({
        Bucket:
          this.options_.bucket,
        Key:
          key,
        Body:
          optimized.buffer,
        ContentType:
          optimized.mimeType ||
          file.mimeType,
        CacheControl:
          "public, max-age=31536000, immutable",
      })
    )

    this.logger_.info(
      `[R2 Optimizer] ${file.filename}: ${original.length} -> ${optimized.buffer.length} bytes${
        optimized.decision
          ? ` (${optimized.decision})`
          : ""
      }`
    )

    return {
      key,
      url:
        publicUrl(
          this.options_.file_url,
          key
        ),
    }
  }

  async getUploadStream(
    file: FileTypes.ProviderUploadStreamDTO
  ): Promise<{
    writeStream: Writable
    promise: Promise<FileTypes.ProviderFileResultDTO>
    url: string
    fileKey: string
  }> {
    const cleanName =
      sanitizeFilename(
        file.filename
      )

    const parsed =
      path.parse(
        cleanName
      )

    /*
     * Video stream uploads are written to a temporary file first.
     * That lets ffprobe inspect the source and FFmpeg optimize it
     * before the final R2 object is uploaded.
     */
    if (
      isVideoMime(
        file.mimeType
      )
    ) {
      const key =
        `${parsed.name}-${ulid()}.mp4`

      const url =
        publicUrl(
          this.options_.file_url,
          key
        )

      const tempDir =
        await mkdtemp(
          path.join(
            os.tmpdir(),
            "safafi-video-stream-"
          )
        )

      const inputPath =
        path.join(
          tempDir,
          `input${safeInputExtension(
            file.filename
          )}`
        )

      const writeStream =
        createWriteStream(
          inputPath
        )

      const promise =
        new Promise<FileTypes.ProviderFileResultDTO>(
          (
            resolve,
            reject
          ) => {
            writeStream.on(
              "error",
              async (
                error
              ) => {
                await rm(
                  tempDir,
                  {
                    recursive:
                      true,
                    force:
                      true,
                  }
                ).catch(
                  () =>
                    undefined
                )

                reject(
                  error
                )
              }
            )

            writeStream.on(
              "finish",
              async () => {
                try {
                  const inputStat =
                    await stat(
                      inputPath
                    )

                  const optimized =
                    await optimizeVideoFromPath(
                      inputPath,
                      inputStat.size,
                      file.filename,
                      file.mimeType
                    )

                  await this.client_.send(
                    new PutObjectCommand({
                      Bucket:
                        this.options_.bucket,
                      Key:
                        key,
                      Body:
                        optimized.buffer,
                      ContentType:
                        "video/mp4",
                      CacheControl:
                        "public, max-age=31536000, immutable",
                    })
                  )

                  this.logger_.info(
                    `[R2 Optimizer] ${file.filename}: ${inputStat.size} -> ${optimized.buffer.length} bytes${
                      optimized.decision
                        ? ` (${optimized.decision})`
                        : ""
                    }`
                  )

                  resolve({
                    key,
                    url,
                  })
                } catch (
                  error
                ) {
                  reject(
                    error
                  )
                } finally {
                  await rm(
                    tempDir,
                    {
                      recursive:
                        true,
                      force:
                        true,
                    }
                  ).catch(
                    () =>
                      undefined
                  )
                }
              }
            )
          }
        )

      return {
        writeStream,
        fileKey:
          key,
        url,
        promise,
      }
    }

    const shouldOptimize =
      !!file.mimeType &&
      IMAGE_TYPES.has(
        file.mimeType.toLowerCase()
      )

    const extension =
      shouldOptimize
        ? ".webp"
        : parsed.ext

    const key =
      `${parsed.name}-${ulid()}${extension}`

    const output =
      new PassThrough()

    const upload =
      new Upload({
        client:
          this.client_,
        params: {
          Bucket:
            this.options_.bucket,
          Key:
            key,
          Body:
            output,
          ContentType:
            shouldOptimize
              ? "image/webp"
              : file.mimeType,
          CacheControl:
            "public, max-age=31536000, immutable",
        },
      })

    let writeStream:
      Writable

    if (
      shouldOptimize
    ) {
      const transformer =
        sharp()
          .rotate()
          .resize({
            width:
              2000,
            height:
              2000,
            fit:
              "inside",
            withoutEnlargement:
              true,
          })
          .webp({
            quality:
              86,
            alphaQuality:
              100,
            effort:
              4,
          })

      transformer.pipe(
        output
      )

      writeStream =
        transformer
    } else {
      writeStream =
        output
    }

    const url =
      publicUrl(
        this.options_.file_url,
        key
      )

    return {
      writeStream,
      fileKey:
        key,
      url,
      promise:
        upload
          .done()
          .then(
            () => ({
              key,
              url,
            })
          ),
    }
  }

  async delete(
    files:
      | FileTypes.ProviderDeleteFileDTO
      | FileTypes.ProviderDeleteFileDTO[]
  ): Promise<void> {
    if (
      Array.isArray(
        files
      )
    ) {
      if (
        !files.length
      ) {
        return
      }

      await this.client_.send(
        new DeleteObjectsCommand({
          Bucket:
            this.options_.bucket,
          Delete: {
            Objects:
              files.map(
                (
                  file
                ) => ({
                  Key:
                    file.fileKey,
                })
              ),
            Quiet:
              true,
          },
        })
      )

      return
    }

    await this.client_.send(
      new DeleteObjectCommand({
        Bucket:
          this.options_.bucket,
        Key:
          files.fileKey,
      })
    )
  }

  async getPresignedDownloadUrl(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<string> {
    return getSignedUrl(
      this.client_,
      new GetObjectCommand({
        Bucket:
          this.options_.bucket,
        Key:
          file.fileKey,
      }),
      {
        expiresIn:
          3600,
      }
    )
  }

  async getPresignedUploadUrl(
    file: FileTypes.ProviderGetPresignedUploadUrlDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    /*
     * Presigned uploads go directly from the client to R2, so they
     * bypass Sharp/FFmpeg processing. Existing behavior is preserved.
     */
    const key =
      sanitizeFilename(
        file.filename
      )

    const url =
      await getSignedUrl(
        this.client_,
        new PutObjectCommand({
          Bucket:
            this.options_.bucket,
          Key:
            key,
          ContentType:
            file.mimeType,
        }),
        {
          expiresIn:
            file.expiresIn ??
            3600,
        }
      )

    return {
      key,
      url,
    }
  }

  async getDownloadStream(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<Readable> {
    const response =
      await this.client_.send(
        new GetObjectCommand({
          Bucket:
            this.options_.bucket,
          Key:
            file.fileKey,
        })
      )

    return response.Body as Readable
  }

  async getAsBuffer(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<Buffer> {
    const response =
      await this.client_.send(
        new GetObjectCommand({
          Bucket:
            this.options_.bucket,
          Key:
            file.fileKey,
        })
      )

    return Buffer.from(
      await response.Body!.transformToByteArray()
    )
  }
}

export default OptimizedR2FileService