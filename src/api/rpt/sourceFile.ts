import type { PageParam, PageResult } from '@/http/types'
import { http } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'

/** 数据底稿分页请求参数 */
export interface SourceFilePageReqVO extends PageParam {
  name?: string // 名称
  batchId?: number // 数据版本编号
  deptId?: number // 负责部门ID
  createTime?: string[] // 创建时间区间
}

/** 数据底稿 */
export interface SourceFileVO {
  id: number // 编号
  defId: number // 底稿定义ID
  deptId?: number // 负责部门ID
  name?: string // 名称
  defCode?: string // 底稿编码
  batchId?: number // 数据版本
  fileUrl?: string // 底稿文件地址
  createTime?: string // 创建时间
}

/** 底稿上传进度项 */
export interface DraftProgressItem {
  draftDefId: number // 底稿定义ID
  draftName: string // 底稿名称
  deptId?: number // 负责部门ID
  uploaded: boolean // 是否已上传
  fileUrl?: string // 已上传文件地址
}

/** 报表可用性项 */
export interface TemplateAvailabilityItem {
  templateId: number // 模板ID
  templateName: string // 模板名称
  available: boolean // 是否可生成
  missingDraftNames?: string[] // 缺失底稿名称
  missingReportNames?: string[] // 缺失前置报表名称
  missingConfigNames?: string[] // 缺失配置项
}

/** 底稿可用性响应 */
export interface SourceFileAvailabilityVO {
  batchId?: number // 数据版本ID
  ready: TemplateAvailabilityItem[] // 可生成报表列表
  notReady: TemplateAvailabilityItem[] // 未就绪报表列表
  draftProgress: DraftProgressItem[] // 底稿上传进度
  uploadedDraftCount: number // 已上传底稿数
  requiredDraftCount: number // 需上传底稿总数
}

/** 批量上传响应项 */
export interface SourceFileBatchUploadItem {
  originalName: string // 原始文件名
  draftName?: string // 匹配到的底稿名称
  success: boolean // 是否成功
  message?: string // 结果信息
}

/** 批量上传响应 */
export interface SourceFileBatchUploadVO {
  success: number // 成功数
  fail: number // 失败数
  unmatched: number // 未匹配文件数
  items: SourceFileBatchUploadItem[] // 明细
  availability: SourceFileAvailabilityVO // 上传后最新可用性
}

/** 单个上传响应 */
export interface SourceFileOneUploadVO {
  success: boolean // 是否成功
  message?: string // 结果信息
  batchId?: number // 数据版本ID
  defId?: number // 底稿定义ID
  draftName?: string // 底稿名称
  fileUrl?: string // 文件地址
  availability?: SourceFileAvailabilityVO // 上传后最新可用性
}

/** 获得数据底稿分页 */
export function getSourceFilePage(params: SourceFilePageReqVO) {
  return http.get<PageResult<SourceFileVO>>('/rpt/source-file/page', params)
}

/** 获得某数据版本下的底稿可用性 */
export function getSourceFileAvailability(batchId?: number) {
  return http.get<SourceFileAvailabilityVO>('/rpt/source-file/availability', { batchId })
}

/**
 * 批量上传底稿（multipart/form-data）
 *
 * 按文件名开头的底稿编码自动匹配底稿定义。
 * @param batchId 数据版本ID（必填）
 * @param files 本地文件路径列表
 * @param overwrite 是否覆盖同名底稿
 */
export function batchUploadSourceFiles(batchId: number, files: string[], overwrite = false) {
  const userStore = useUserStore()
  return useTokenStore().tryGetValidToken().then(token => new Promise<SourceFileBatchUploadVO>((resolve, reject) => {
    uni.uploadFile({
      url: `${getEnvBaseUrl()}/rpt/source-file/batch-upload`,
      files: files.map(path => ({ name: 'files', uri: path })),
      formData: { batchId: String(batchId), overwrite: String(overwrite) },
      header: {
        'tenant-id': userStore.tenantId,
        'Authorization': `Bearer ${token}`,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const result = JSON.parse(res.data)
          if (result.code === 0) {
            resolve(result.data)
          } else {
            reject(new Error(result.msg || '上传失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        console.error('底稿批量上传失败：', err)
        reject(err)
      },
    })
  }))
}

/**
 * 上传单个底稿（multipart/form-data，按底稿定义上传）
 * @param defId 底稿定义ID（必填）
 * @param batchId 数据版本ID（必填）
 * @param filePath 本地文件路径
 */
export function uploadOneSourceFile(defId: number, batchId: number, filePath: string) {
  const userStore = useUserStore()
  return useTokenStore().tryGetValidToken().then(token => new Promise<SourceFileOneUploadVO>((resolve, reject) => {
    uni.uploadFile({
      url: `${getEnvBaseUrl()}/rpt/source-file/upload-one`,
      filePath,
      name: 'file',
      formData: { defId: String(defId), batchId: String(batchId) },
      header: {
        'tenant-id': userStore.tenantId,
        'Authorization': `Bearer ${token}`,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          const result = JSON.parse(res.data)
          if (result.code === 0) {
            resolve(result.data)
          } else {
            reject(new Error(result.msg || '上传失败'))
          }
        } else {
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        console.error('底稿上传失败：', err)
        reject(err)
      },
    })
  }))
}
