/**
 * 权限范围模型
 */
import { Schema } from 'mongoose'


import * as reply from '../lib/reply.js'
import * as detective from '../lib/detective.js'

import * as database from '../store/database.js'


import * as scope from '../schema/scope.js'




export namespace Default
{
	export type Define = scope.Default

	export type Methods = {
		delay(to: Date): Promise<void>

	}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	export type Statics = {}

	export type Schema = database.Schema<Default.Define, Default.Methods, Default.Statics>

	export type Keywords = database.Probe<Default.Define>

	export type Document = database.Document<Default.Schema>


}


// eslint-disable-next-line @stylistic/function-call-spacing
export const default_schema: Default.Schema = new Schema
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


default_schema.index(
	{ lock: 1, expire: 1 },

)


export default default_schema


export { Mode, Role } from '../schema/scope.js'


export function align (...mode: scope.Mode[]): number
{
	let value = Object.values(scope.Role)
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


export function some (value: scope.Role, ...role: scope.Role[]): boolean
{
	value = Math.abs(value)

	if (value === scope.Role.无限)
	{
		return true

	}

	return role.some(
		v => (v & value) > 0,

	)

}


export function never (value: scope.Role, ...role: scope.Role[]): boolean
{
	return some(value, ...role) === false

}


export function mixed (value: scope.Role, ...role: scope.Role[]): scope.Role
{
	value = Math.abs(value)

	if (value === scope.Role.无限)
	{
		return scope.Role.无限

	}


	return role.reduce(
		(a, b) => a | Math.abs(b),

		value,

	)

}


export function pick (value: scope.Role, ...mode: scope.Mode[]): number
{
	return value & align(...mode)


}


export function exclude (value: scope.Role, ...mode: scope.Mode[]): number
{
	value = Math.abs(value)

	return value & (
		value ^ align(...mode)

	)

}


export function derive (value: scope.Role, ...mode: scope.Mode[]): number
{
	value = Math.abs(value)

	return mode.reduce(
		(a, b) => a | chmod(value, b),

		value,

	)

}


export function chmod (value: scope.Role, mode: scope.Mode): scope.Role
{
	value = Math.abs(value)

	if (value === scope.Role.无限)
	{
		return scope.Role.无限

	}

	return value << Math.abs(mode)

}


export function vtmod (value: scope.Role): scope.Mode
{
	value = Math.abs(value)

	if (value <= scope.Role.普通)
	{
		return scope.Mode.普通

	}

	if (value === scope.Role.无限)
	{
		return scope.Mode.系统

	}

	let vxmode = Object.values(scope.Mode)
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

		scope.Mode.普通,

	)

}
