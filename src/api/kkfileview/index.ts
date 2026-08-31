import { http } from '@/http/http'

/** 文件预览请求 */
export interface FilePreviewReqVO {
  fileUrl: string // 系统内文件地址（相对或绝对，必填）
  fileName?: string // 文件名（辅助识别类型）
  watermark?: string // 水印文字（空则用全局配置）
}

/** 文件预览响应 */
export interface FilePreviewRespVO {
  previewUrl: string // kkFileView 预览地址，前端用 web-view 嵌入
}

/** 获取文件在线预览地址 */
export function getFilePreviewUrl(data: FilePreviewReqVO) {
  return http.post<FilePreviewRespVO>('/kkfileview/preview/url', data)
}
