/**
 * 权限范围模型
 */
import { Schema } from 'mongoose'


import * as model from '../lib/model.js'
import * as reply from '../lib/reply.js'
import * as detective from '../lib/detective.js'

import * as database from '../store/database.js'




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


// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Default
{
	export type Model = model.Define<
		{
			lock: boolean

			value : number
			expire: Date

		},

		{
			is_expire: boolean

		}

	>

	export type Schema = database.Schema<
		Model,

		{
			delay(to: Date): Promise<void>

		},

		// eslint-disable-next-line @typescript-eslint/no-empty-object-type
		{}

	>

	export type HydratedDocument = database.HydratedDocument<Schema>

}

// eslint-disable-next-line @stylistic/function-call-spacing
export const schema: Default.Schema = new Schema
(
	{
		// 锁定
		lock: {
			type    : Boolean,
			required: true,
			default : false,

		},

		// 范围
		value: {
			type    : Number,
			required: true,

		},

		// 过期时间
		expire: {
			type    : Date,
			required: true,

		},

	},

	{
		virtuals: {
			is_expire: {
				get ()
				{
					return new Date() > this.expire

				},

			},


		},

		methods: {
			async delay (to)
			{
				if (new Date() > to)
				{
					throw new reply.Forbidden('invalid date')

				}

				this.expire = to

				await this.save()


			},

		},


	},


)


schema.index(
	{ lock: 1, expire: 1 },

)


export default schema


export function align (...mode: Mode[]): number
{
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


export function some (value: Role, ...role: Role[]): boolean
{
	value = Math.abs(value)

	if (value === Role.无限)
	{
		return true

	}

	return role.some(
		v => (v & value) > 0,

	)

}


export function never (value: Role, ...role: Role[]): boolean
{
	return some(value, ...role) === false

}


export function mixed (value: Role, ...role: Role[]): Role
{
	value = Math.abs(value)

	if (value === Role.无限)
	{
		return Role.无限

	}


	return role.reduce(
		(a, b) => a | Math.abs(b),

		value,

	)

}


export function pick (value: Role, ...mode: Mode[]): number
{
	return value & align(...mode)


}


export function exclude (value: Role, ...mode: Mode[]): number
{
	value = Math.abs(value)

	return value & (
		value ^ align(...mode)

	)

}


export function derive (value: Role, ...mode: Mode[]): number
{
	value = Math.abs(value)

	return mode.reduce(
		(a, b) => a | chmod(value, b),

		value,

	)

}


export function chmod (value: Role, mode: Mode): Role
{
	value = Math.abs(value)

	if (value === Role.无限)
	{
		return Role.无限

	}

	return value << Math.abs(mode)

}


export function vtmod (value: Role): Mode
{
	value = Math.abs(value)

	if (value <= Role.普通)
	{
		return Mode.普通

	}

	if (value === Role.无限)
	{
		return Mode.系统

	}

	let vxmode = Object.values(Mode)
		.filter(detective.is_finite_number)
		.toSorted(
			(a, b) => a - b,

		)

	return vxmode.reduce(
		(a, b) =>
		{
			let v = value & align(b)

			if (v > 0)
			{
				return b

			}

			return a

		},

		Mode.普通,

	)

}
