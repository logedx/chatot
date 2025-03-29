/**
 * 权限范围模型
 */
import moment from 'moment'
import { Schema, Model, HydratedDocument } from 'mongoose'

import * as storage from '../lib/storage.js'
import * as detective from '../lib/detective.js'




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
		this: THydratedDocumentType,

		day: number

	): Promise<void>

}

export type THydratedDocumentType = HydratedDocument<TRawDocType, TVirtuals & TInstanceMethods>

export type TModel = Model<TRawDocType, TQueryHelpers, TInstanceMethods, TVirtuals>




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
		async delay(v) {
			this.expired = moment().add(v, 'days')
				.toDate()

			await this.save()


		},

	},


)

export default schema


export function some(value: Role, ...role: Array<Role>): boolean {
	if (value === Role.无限) {
		return true

	}

	return role.some(
		// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
		v => v === (v & value),

	)

}

export function align(...mode: Array<Mode>): number {
	let value = Object.values(Role)
		.filter(detective.is_finite_number)
		.reduce(
			(a, b) => a | b,

			0,

		)

	return mode.reduce(
		(a, m) => a | chmod(value, m),

		0,

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

export function derive(value: Role, ...mode: Array<Mode>): number {
	return mode.reduce(
		(a, b) => a | chmod(value, b),

		value,

	)

}

export function pick(value: Role, ...mode: Array<Mode>): number {
	return value & align(...mode)


}

export function exclude(value: Role, ...mode: Array<Mode>): number {
	return value & (
		value ^ align(...mode)

	)

}

export function chmod(value: Role, mode: Mode): Role {
	if (value === Role.无限) {
		return Role.无限

	}

	return value << mode

}

export function vtmod(value: Role): Mode {
	if (value <= Role.普通) {
		return Mode.普通

	}

	if (value === Role.无限) {
		return Mode.系统

	}

	let vxmod = Object.values(Mode)
		.filter(detective.is_number)
		.toSorted(
			(a, b) => a - b,

		)

	let vscope = Math.floor(value)
		.toString(2)
		.split('')
		.reverse()

	return vscope.reduce(
		(a, b, i) => {
			if (b === '0') {
				return a

			}

			let v = vxmod[i % vxmod.length]

			// eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
			return v > a ? v : a

		},

		Mode.普通,

	)

}