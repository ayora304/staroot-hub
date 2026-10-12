export const ENDPOINTS = {
  session: '/auth/session',
  logout: '/auth/logout',
  approvalsSubmit: '/approvals/submit',
  approvalsDecide: '/approvals/decide',
  approvalsResubmit: '/approvals/resubmit',
  approvalsList: '/approvals/list',
  approvalsDetail: '/approvals/detail',
  notificationsList: '/notifications/list',
  notificationsRead: '/notifications/read',
} as const
