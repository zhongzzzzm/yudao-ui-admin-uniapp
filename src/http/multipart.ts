import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { getEnvBaseUrl } from '@/utils'

/**
 * 带登录态的 multipart 文件上传（用于后端导入接口，如 /validation/report/import）
 * 与 FileApi.uploadFile 同一套鉴权头，但目标是业务导入端点而非文件服务
 */
export function uploadMultipart<T = any>(
  url: string,
  filePath: string,
  formData?: Record<string, any>,
): Promise<T> {
  const userStore = useUserStore()
  return useTokenStore().tryGetValidToken().then(token => new Promise<T>((resolve, reject) => {
    uni.uploadFile({
      url: `${getEnvBaseUrl()}${url}`,
      filePath,
      name: 'file',
      formData,
      header: {
        'Accept': '*/*',
        'tenant-id': userStore.tenantId,
        'Authorization': `Bearer ${token}`,
      },
      success: (res) => {
        if (res.statusCode !== 200) {
          reject(new Error('导入失败'))
          return
        }
        try {
          const result = JSON.parse(res.data)
          if (result.code === 0) {
            resolve(result.data as T)
          } else {
            reject(new Error(result.msg || '导入失败'))
          }
        } catch {
          reject(new Error('导入响应解析失败'))
        }
      },
      fail: err => reject(err),
    })
  }))
}

/**
 * 选择本地文件（Excel 导入等），成功回调拿到临时路径与文件名。
 * App 端无系统能力选择任意文件，回调 err 提示。
 */
export function chooseImportFile(onChosen: (filePath: string, fileName: string) => void, onFail?: (msg: string) => void) {
  // #ifdef H5
  uni.chooseFile?.({
    count: 1,
    success: (res: any) => {
      const path = res.tempFilePaths?.[0]
      if (path) {
        onChosen(path, res.tempFiles?.[0]?.name || path.split('/').pop() || '导入文件')
      }
    },
    fail: () => onFail?.('选择文件失败'),
  })
  // #endif
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    success: (res) => {
      const file = res.tempFiles?.[0]
      if (file) {
        onChosen(file.path, file.name || '导入文件')
      }
    },
    fail: () => onFail?.('选择文件失败'),
  })
  // #endif
  // #ifdef APP-PLUS
  onFail?.('App 端暂不支持文件导入，请使用 H5 或 PC 端操作')
  // #endif
}
