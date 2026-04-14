import * as detective from './detective.js'





export type GetProperty<T, V>
	= {
		[K in keyof T as T[K] extends V ? K : never]: T[K]

	}

export type GetPartial<T>
	= {
		[K in keyof T as T extends Record<K, T[K]> ? never : K]: T[K]

	}

export type GetRequired<T>
	= {
		[K in keyof T as T extends Record<K, T[K]> ? K : never]: T[K]

	}

export type GetInterLastElement<U> = U extends Array<infer R> ? R : never

export type GetTupleLastElement<U> = U extends [...infer _, infer L] ? L : never

export type GetUnionLastElement<U> = GetInterLastElement<UnionToInter<U> >

export type UnionToInter<U>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	= (U extends any ? (k: U[]) => void : never) extends (k: infer I) => void
		? I
		: never

export type UnionToTuple
<
	T,

	E = Exclude<T, undefined>,
	L = GetUnionLastElement<E>,

>
	= [E] extends [never]
		? []
		: [...UnionToTuple<Exclude<E, L> >, L]

export type Replace<T, U, V>
	= T extends U
		? V
		: T extends object
			? { [K in keyof T]: Replace<T[K], U, V> }
			: T

export type Overwrite<T, U> = Omit<T, keyof U> & U


export function clone <T> (target: T): T
{
	if (detective.is_array(target) )
	{
		return target.map(clone) as T

	}

	if (detective.is_object_legitimism(target) )
	{
		let r = Object.entries(target)
			.reduce(
				(map, [k, v]) =>
				{
					map[k] = clone(v)

					return map

				},

				{} as Record<PropertyKey, unknown>,

			)

		return r as T

	}

	return target

}

export function get
<T extends object, K extends keyof T = keyof T> (source: T, key: K extends string ? Lowercase<K> : K): T[K]

export function get
<T> (source: object, key: PropertyKey, _default: T): T

export function get
<T> (source: object, key: PropertyKey, _default?: T): T
{
	key = key.toString().toLowerCase()


	let value: unknown = source

	for (let nk of key.split('.') )
	{
		if (detective.is_object(value) === false)
		{
			break

		}


		if (detective.is_array(value) )
		{
			value = clone(value[Number(nk)])

			if (detective.is_undefined(value) )
			{
				break

			}

			continue

		}



		let v = Object.entries(value)
			.find(
				([k]) => k.toLowerCase() === nk,

			)


		if (detective.is_undefined(v) )
		{
			value = v

			break

		}

		value = v[1]

	}


	if (detective.is_undefined(value) === false)
	{
		return value as T

	}

	if (detective.is_undefined(_default) === false)
	{
		return _default

	}

	throw new Error(`${key} is not exist`)

}

export function pick
<T extends object, K extends keyof T> (source: T, ...keys: K[]): { [k in K]: T[k] }

export function pick
<T extends object, K extends keyof T> (source: T, _default: { [k in K]: T[k] }): { [k in K]-?: T[k] }

export function pick
<T extends object, K extends keyof T> (source: T, arg0: unknown, ...other: K[]): { [k in K]: T[k] }
{
	let _default = {} as T

	if (detective.is_object_legitimism(arg0) )
	{
		_default = arg0 as T

		other = Object.keys(arg0) as K[]

	}
	else
	{
		other = [arg0 as K, ...other]

	}

	let map = new Set(other)

	let value = {} as Pick<T, K>

	for (let k of Array.from(map) )
	{
		value[k] = clone(detective.is_undefined(source[k]) ? _default[k] : source[k])

	}

	return value

}

export function omit
<T extends object, K extends keyof T> (source: T, ...name: K[]): Omit<T, K>
{
	let value = clone(source)

	for (let v of name)
	{
		delete value[v]

	}

	return value

}




export class Auspice<T>
{
	#v: unknown

	#e: unknown


	get value (): T extends Error ? never : T
	{
		if (detective.is_exist(this.#e) )
		{
			throw this.#e

		}

		return this.#v as T extends Error ? never : T

	}

	is_ok (): T extends Promise<unknown> ? Promise<boolean> : boolean
	{
		type R = T extends Promise<unknown> ? Promise<boolean> : boolean

		if (detective.is_exist(this.#e) )
		{
			return false as R

		}

		if (detective.is_promise(this.#v) )
		{
			let x = this.#v
				.then(
					v =>
					{
						if (v instanceof Error)
						{
							this.#e = v

						}

						else
						{
							this.#v = v

						}

						return true

					},

				)
				.catch(
					(e: unknown) =>
					{
						this.#e = e

						return false

					},

				)

			return x as R

		}

		return true as R


	}

	is_error (): T extends Promise<unknown> ? Promise<boolean> : boolean
	{
		type R = T extends Promise<unknown> ? Promise<boolean> : boolean

		let x = this.is_ok()

		if (detective.is_promise(x) )
		{
			return x.then(v => v === false) as R

		}

		return (x === false) as R

	}

	unwrap (): [T extends Error ? never : T, T extends Error ? T : never]
	{
		return [this.#v, this.#e] as [T extends Error ? never : T, T extends Error ? T : never]

	}

	call
	<F extends (...args: any[]) => T> (fn: F, ...params: Parameters<F>): this
	{
		try
		{
			let v = fn(...params)

			if (v instanceof Error)
			{
				this.#e = v

			}

			else
			{
				this.#v = v

			}

		}

		catch (e)
		{
			this.#e = e

		}

		return this

	}

	static call
	<F extends (...args: any[]) => unknown, T = ReturnType<F> > (fn: F, ...params: Parameters<F>): Auspice<T>
	{
		return new Auspice<T>().call(fn as (...args: any[]) => T, ...params)

	}

}

