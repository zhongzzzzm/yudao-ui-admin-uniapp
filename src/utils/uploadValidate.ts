/**
 * 上传前置校验工具
 *
 * 类型白名单与大小上限在「选择完成 → 发起请求」之间校验，
 * 超限/类型不符时立即提示，不等后端返回。
 */

/** 单文件大小上限（MB），与后端 application.yaml 的 multipart.max-file-size 对齐 */
export const MAX_UPLOAD_SIZE_MB = 16

/** 底稿文件类型白名单（图片 + pdf + excel） */
export const SOURCE_FILE_ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'pdf', 'xls', 'xlsx']

export interface ChosenFileMeta {
  /** 临时文件路径 */
  path: string
  /** 原始文件名（H5 的 blob 路径不含扩展名，优先取选择器返回的 name） */
  name?: string
  /** 文件大小（字节），选择器未返回时跳过大小校验 */
  size?: number
}

/** 从路径推断文件名 */
export function fileNameOf(file: ChosenFileMeta): string {
  if (file.name) {
    return file.name
  }
  return file.path.includes('/') ? file.path.substring(file.path.lastIndexOf('/') + 1) : file.path
}

/**
 * 校验单个文件（扩展名 + 大小）
 * @returns 错误提示文案；null 表示通过
 */
export function validateUploadFile(
  file: ChosenFileMeta,
  allowedExts: string[],
  maxSizeMb: number = MAX_UPLOAD_SIZE_MB,
): string | null {
  const name = fileNameOf(file)
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
  if (!ext || !allowedExts.includes(ext)) {
    return `仅支持 ${allowedExts.join('/')} 格式`
  }
  if (file.size != null && file.size > maxSizeMb * 1024 * 1024) {
    return `「${name}」超过 ${maxSizeMb}MB 大小限制`
  }
  return null
}

/** 批量校验：返回 { valid, invalidCount, firstError } */
export function validateUploadFiles(files: ChosenFileMeta[], allowedExts: string[]) {
  let invalidCount = 0
  let firstError: string | null = null
  const valid: ChosenFileMeta[] = []
  for (const file of files) {
    const err = validateUploadFile(file, allowedExts)
    if (err) {
      invalidCount++
      firstError ??= err
    } else {
      valid.push(file)
    }
  }
  return { valid, invalidCount, firstError }
}
