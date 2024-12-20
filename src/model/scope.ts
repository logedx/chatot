/**
 * 权限范围模型
 */
import moment from 'moment'
import { Schema, Model, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'




export enum Mode {
	'普通', '管理', '接口', '系统'

}

export enum Role {
	'普通' = 0b0_0000_0000_0000,
	'管理' = 0b0_0000_0000_0001,
	'财务' = 0b0_0000_0001_0000,
	'运营' = 0b0_0001_0000_0000,

	// eslint-disable-next-line @typescript-eslint/prefer-literal-enum-member
	'无限' = Infinity,

}



export type TRawDocType = storage.TRawDocType<
	{
		lock: boolean

		value: number
		deadline: string

		actived: Date
		expired: Date

	}

>

export type TPopulatePaths = object

export type TVirtuals = {
	role: keyof typeof Role
	is_expire: boolean

}

export type TQueryHelpers = object

export type TInstanceMethods = {
	delay(
		// eslint-disable-next-line no-use-before-define
		this: THydratedDocumentType

	): void

}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>


/**
 * 有效期校验规则
 */
const deadline_match = /^\d+[日|天|周|月|年]$/



export const schema = new Schema<
	TRawDocType,
	TModel,
	TInstanceMethods,
	TQueryHelpers,
	TVirtuals

>(
	{
		// 锁定
		lock: {
			type: Boolean,
			required: true,
			default: false,

		},

		// 范围
		value: {
			type: Number,
			required: true,
			default: 0,

		},

		// 有效期
		deadline: {
			type: String,
			required: true,
			trim: true,
			validate: deadline_match,
			default: '1周',

		},

		// 认证时间
		actived: {
			type: Date,
			required: true,
			default: () => new Date(),

		},

		// 过期时间
		expired: {
			type: Date,
			required: true,
			default: () => moment().add(1, 'w')
				.toDate(),

		},

	},


)


schema.index(
	{ lock: 1, expired: 1 },

)


schema.virtual('role').get(
	function (): TVirtuals['role'] {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		if (Role.财务 > this.value) {
			return '管理'

		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		if (Role.运营 > this.value) {
			return '财务'

		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		if (Role.无限 > this.value) {
			return '运营'

		}

		return '无限'

	},

)

schema.virtual('is_expire').get(
	function (): TVirtuals['is_expire'] {
		return new Date() > this.expired

	},

)


schema.method(
	{
		delay() {
			this.expired = delay(this.actived, this.deadline)

		},

	},


)

export default schema


export { deadline_match }



/**
 * 认证时间顺延
 */
export function delay(value: string | Date, deadline: string): Date {
	let keys: Record<string, moment.unitOfTime.Base> = {
		'日': 'day',
		'天': 'day',
		'周': 'week',
		'月': 'month',
		'年': 'year',

	}

	let n = deadline.slice(0, -1)
	let d = deadline.slice(-1)

	return moment(value).add(~~n, keys[d])
		.toDate()

}


export function some(value: Role, ...role: Array<Role>): boolean {
	if (value === Role.无限) {
		return true

	}

	return role.some(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		v => v === (v & value),

	)

}

export function mixed(value: Role, ...role: Array<Role>): Role {
	if (value === Role.无限) {
		return Role.无限

	}


	return role.reduce(
		(a, b) => a | b,

		value,
	)

}

export function chmod(value: Role, mode: Mode): Role {
	if (value === Role.无限) {
		return Role.无限

	}

	return value << mode

}