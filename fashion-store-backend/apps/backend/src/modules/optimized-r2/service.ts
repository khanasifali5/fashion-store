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

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
])

function decodeContent(content: string, mimeType?: string): Buffer {
  const decoded = Buffer.from(content, "base64")

  if (decoded.toString("base64") === content) {
    return decoded
  }

  const isText =
    mimeType?.startsWith("text/") ||
    mimeType?.includes("csv") ||
    mimeType?.includes("json") ||
    mimeType?.includes("xml")

  return isText
    ? Buffer.from(content, "utf8")
    : Buffer.from(content, "binary")
}

function sanitizeFilename(filename: string) {
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "-")
}

function publicUrl(base: string, key: string) {
  const encoded = key.split("/").map(encodeURIComponent).join("/")
  return `${base.replace(/\/$/, "")}/${encoded}`
}

async function optimizeImage(input: Buffer, mimeType?: string) {
  if (!mimeType || !IMAGE_TYPES.has(mimeType.toLowerCase())) {
    return {
      buffer: input,
      mimeType,
      extension: undefined as string | undefined,
    }
  }

  const metadata = await sharp(input, { failOn: "none" }).metadata()

  const quality = metadata.hasAlpha ? 90 : 86

  const buffer = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({
      width: 2000,
      height: 2000,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality,
      alphaQuality: 100,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer()

  return {
    buffer,
    mimeType: "image/webp",
    extension: ".webp",
  }
}

class OptimizedR2FileService extends AbstractFileProviderService {
  static identifier = "optimized-r2"

  protected logger_: Logger
  protected options_: Options
  protected client_: S3Client

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()

    this.logger_ = logger
    this.options_ = options

    this.client_ = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      credentials: {
        accessKeyId: options.access_key_id,
        secretAccessKey: options.secret_access_key,
      },
    })
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!file?.filename) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No filename provided"
      )
    }

    const original = decodeContent(file.content, file.mimeType)
    const optimized = await optimizeImage(original, file.mimeType)

    const cleanName = sanitizeFilename(file.filename)
    const parsed = path.parse(cleanName)

    const extension = optimized.extension ?? parsed.ext
    const key = `${parsed.name}-${ulid()}${extension}`

    await this.client_.send(
      new PutObjectCommand({
        Bucket: this.options_.bucket,
        Key: key,
        Body: optimized.buffer,
        ContentType: optimized.mimeType || file.mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    )

    this.logger_.info(
      `[R2 Optimizer] ${file.filename}: ${original.length} -> ${optimized.buffer.length} bytes`
    )

    return {
      key,
      url: publicUrl(this.options_.file_url, key),
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
    const cleanName = sanitizeFilename(file.filename)
    const parsed = path.parse(cleanName)

    const shouldOptimize =
      !!file.mimeType && IMAGE_TYPES.has(file.mimeType.toLowerCase())

    const extension = shouldOptimize ? ".webp" : parsed.ext
    const key = `${parsed.name}-${ulid()}${extension}`

    const output = new PassThrough()

    const upload = new Upload({
      client: this.client_,
      params: {
        Bucket: this.options_.bucket,
        Key: key,
        Body: output,
        ContentType: shouldOptimize ? "image/webp" : file.mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      },
    })

    let writeStream: Writable

    if (shouldOptimize) {
      const transformer = sharp()
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 86,
          alphaQuality: 100,
          effort: 4,
        })

      transformer.pipe(output)
      writeStream = transformer
    } else {
      writeStream = output
    }

    const url = publicUrl(this.options_.file_url, key)

    return {
      writeStream,
      fileKey: key,
      url,
      promise: upload.done().then(() => ({
        key,
        url,
      })),
    }
  }

  async delete(
    files:
      | FileTypes.ProviderDeleteFileDTO
      | FileTypes.ProviderDeleteFileDTO[]
  ): Promise<void> {
    if (Array.isArray(files)) {
      if (!files.length) return

      await this.client_.send(
        new DeleteObjectsCommand({
          Bucket: this.options_.bucket,
          Delete: {
            Objects: files.map((file) => ({
              Key: file.fileKey,
            })),
            Quiet: true,
          },
        })
      )

      return
    }

    await this.client_.send(
      new DeleteObjectCommand({
        Bucket: this.options_.bucket,
        Key: files.fileKey,
      })
    )
  }

  async getPresignedDownloadUrl(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<string> {
    return getSignedUrl(
      this.client_,
      new GetObjectCommand({
        Bucket: this.options_.bucket,
        Key: file.fileKey,
      }),
      { expiresIn: 3600 }
    )
  }

  async getPresignedUploadUrl(
    file: FileTypes.ProviderGetPresignedUploadUrlDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    const key = sanitizeFilename(file.filename)

    const url = await getSignedUrl(
      this.client_,
      new PutObjectCommand({
        Bucket: this.options_.bucket,
        Key: key,
        ContentType: file.mimeType,
      }),
      { expiresIn: file.expiresIn ?? 3600 }
    )

    return {
      key,
      url,
    }
  }

  async getDownloadStream(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<Readable> {
    const response = await this.client_.send(
      new GetObjectCommand({
        Bucket: this.options_.bucket,
        Key: file.fileKey,
      })
    )

    return response.Body as Readable
  }

  async getAsBuffer(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<Buffer> {
    const response = await this.client_.send(
      new GetObjectCommand({
        Bucket: this.options_.bucket,
        Key: file.fileKey,
      })
    )

    return Buffer.from(await response.Body!.transformToByteArray())
  }
}

export default OptimizedR2FileService