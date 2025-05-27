import * as detective from './detective.js'





export type GetProperty<T, V> = {
	[K in keyof T as T[K] extends V ? K : never]: T[K]

}

export type GetPartial<T> = {
	[K in keyof T as T extends Record<K, T[K]> ? never : K]: T[K]

}

export type GetRequired<T> = {
	[K in keyof T as T extends Record<K, T[K]> ? K : never]: T[K]

}

export type Replace<T, U, V> = T extends U
	? V
	: T extends Array<infer A>
		? Array<Replace<A, U, V>>
		: T extends object
			? { [K in keyof T]: Replace<T[K], U, V> }
			: T

export type Overwrite<T, U, O = Omit<T, keyof U> & Required<U>> = {
	[K in keyof O]: Exclude<
		K extends keyof U
			? U[K]
			: K extends keyof T
				? T[K]
				: never,

		undefined

	>

}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnionToInterFunction<U> = U extends any ? (k: () => U) => void : never

export type GetUnionLastElement<U> = UnionToInterFunction<U> extends (a: infer I) => void
	? I extends () => infer R
		? R
		: never
	: never

export type UnionToTuple<
	T,
	E = Exclude<T, undefined>,
	L = GetUnionLastElement<T>,

> = [E] extends [never]
	? []
	: [...UnionToTuple<Exclude<E, L>>, L]






export function clone<T> (target: T): T
{
	if (detective.is_array(target) )
	{
		return target.map(clone) as T

	}

	if (detective.is_object_legitimism(target) )
	{
		return Object.entries(target)
			.reduce(
				(map, [k, v]) =>
				{
					map[k] = clone(v)

					return map

				},

				{} as Record<PropertyKey, unknown>,

			) as T

	}

	return target

}

export function get
<T extends object, K extends keyof T = keyof T>
(source: T, key: K extends string ? Lowercase<K> : K)
: T[K]

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

	throw new Error(`${key.toString()} is not exist`)

}

export function pick
<T extends object, K extends keyof T> (source: T, ...name: K[]): Pick<T, K>
{
	let key = new Set(name)
	let value = {} as Pick<T, K>


	for (let n of Array.from(key) )
	{
		value[n] = clone(source[n])

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
