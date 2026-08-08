/**
 * 权限范围
 */
import * as schema from '../lib/schema.js'




export enum Mode
{
	'普通', '管理', '接口', '系统',

}


export enum Role
{
	'普通' = 0b0_0000_0000_0000,
	'管理' = 0b0_0000_0000_0001,
	'财务' = 0b0_0000_0001_0000,
	'运营' = 0b0_0001_0000_0000,

	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
	'无限' = Infinity,

}


export type Default = schema.Define<
	{
		lock: boolean

		value : number
		expire: Date

	},

	{
		is_expire: boolean

	}

>
