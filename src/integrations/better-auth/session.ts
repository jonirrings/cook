import { createQuery, useQueryClient } from '@tanstack/solid-query'
import { getSession } from '~/lib/auth.functions'

export const sessionQueryKey = ['session'] as const

// 基于 serverFn 的会话读取（替代 better-auth 的 authClient.useSession HTTP 请求）
export function useSession() {
  return createQuery(() => ({
    queryKey: sessionQueryKey,
    queryFn: () => getSession(),
    // 会话在登录/登出等变更后手动失效，不自动过期
    staleTime: Infinity,
    // 服务端不预取会话：否则 SSR 渲染的是查询完成后的状态（登录按钮/用户信息），
    // 而客户端首帧查询还是 pending 渲染骨架屏，两边 DOM 不一致导致 hydration 崩溃
    enabled: !import.meta.env.SSR,
  }))
}

// 登录/注册/登出/注销成功后调用，刷新会话
export function useInvalidateSession() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: sessionQueryKey })
}
