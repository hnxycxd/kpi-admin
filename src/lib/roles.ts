import type { Role } from '../types'
import { EMPLOYEE_MAP, ROLE_ACCOUNTS } from '../data/mock'

export const ROLE_ORDER: Role[] = ['admin', 'reviewer', 'employee']

export const ROLE_LABEL: Record<Role, string> = {
  admin: '管理员',
  reviewer: '审核人',
  employee: '填报人',
}

export const ROLE_HOME: Record<Role, string> = {
  admin: '/projects',
  reviewer: '/people',
  employee: '/my-kpi',
}

export const getRoleEmployee = (role: Role) => EMPLOYEE_MAP[ROLE_ACCOUNTS[role].employeeId]

export const ROLE_META: Record<
  Role,
  { label: string; name: string; position: string; dept: string; intro: string; permissions: string[] }
> = {
  admin: {
    label: '管理员',
    name: EMPLOYEE_MAP[ROLE_ACCOUNTS.admin.employeeId].name,
    position: EMPLOYEE_MAP[ROLE_ACCOUNTS.admin.employeeId].position,
    dept: EMPLOYEE_MAP[ROLE_ACCOUNTS.admin.employeeId].dept,
    intro: '创建考核项目、从人事档案导入人员，发起员工确认并查看全局进度。',
    permissions: ['考核项目管理', '考核人员', '我的考核'],
  },
  reviewer: {
    label: '审核人',
    name: EMPLOYEE_MAP[ROLE_ACCOUNTS.reviewer.employeeId].name,
    position: EMPLOYEE_MAP[ROLE_ACCOUNTS.reviewer.employeeId].position,
    dept: EMPLOYEE_MAP[ROLE_ACCOUNTS.reviewer.employeeId].dept,
    intro: '审核下属 KPI 目标，可增删改指标、批量通过或附说明退回。',
    permissions: ['考核人员', '我的考核'],
  },
  employee: {
    label: '填报人',
    name: EMPLOYEE_MAP[ROLE_ACCOUNTS.employee.employeeId].name,
    position: EMPLOYEE_MAP[ROLE_ACCOUNTS.employee.employeeId].position,
    dept: EMPLOYEE_MAP[ROLE_ACCOUNTS.employee.employeeId].dept,
    intro: '填写本人的关键绩效指标，提交审核并完成最终确认。',
    permissions: ['我的考核'],
  },
}
