import * as detective from './detective.js'





export type GetProperty<T, V> = {
	[K in keyof T as T extends V ? K : never]: T[K]

}

export type GetPartial<T> = {
	[K in keyof T as T extends Record<K, T[K]> ? never : K]: T[K]

}

export type GetRequired<T> = {
	[K in keyof T as T extends Record<K, T[K]> ? K : never]: T[K]

}

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
	L = GetUnionLastElement<T>

> = [E] extends [never]
	? []
	: [...UnionToTuple<Exclude<E, L>>, L,]



export type PropertyTransformHandler = (v: unknown) => unknown

export type PropertyTransformResult<T extends object, V, K extends keyof T> = {
	[N in keyof T]: N extends K ? V : T[N]

}


export function clone<T>(target: T): T {
	// if ('structuredClone' in globalThis) {
	// 	return globalThis.structuredClone<T>(target)

	// }

	if (detective.is_array(target)

	) {
		return target.map(clone) as T

	}

	if (detective.is_object_legitimism(target)

	) {
		return Object.entries(target)
			.reduce(
				(map, [k, v]) => {
					map[k] = clone(v)

					return map

				},

				{} as Record<PropertyKey, unknown>,

			) as T

	}

	return target

}

export function get<
	T extends object,
	K extends keyof T = keyof T

>(
	source: T,
	key: K extends string ? Lowercase<K> : K,

): T[K]

export function get<T>(
	source: object,
	key: PropertyKey,

	_default: T,

): T

export function get<T>(
	source: object,
	key: PropertyKey,

	_default?: T,

): T {
	let nk = key.toString().toLowerCase()

	for (let [k, v] of Object.entries(source)

	) {
		if (nk === k.toLowerCase()

		) {
			return clone(v) as T

		}

	}

	if (detective.is_undefined(_default) === false

	) {
		return _default

	}

	throw new Error(`${key.toString()} is not exist`)

}

export function pick<T extends object, K extends keyof T>(
	source: T,
	...name: Array<K>

): Pick<T, K> {
	let value = {} as Pick<T, K>

	for (let n of name) {
		value[n] = clone(source[n])

	}

	return value

}

export function omit<
	T extends object,
	K extends keyof T,

>(
	source: T,
	...name: Array<K>

): Omit<T, K> {
	let value = clone(source)

	for (let v of name) {
		delete value[v]

	}

	return value

}

export function transform<
	F extends PropertyTransformHandler = PropertyTransformHandler,
	T extends object = object,
	K extends keyof T = keyof T,
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
	R = PropertyTransformResult<T, ReturnType<F>, K>

>(
	source: T,
	key: Array<K>,
	handle: F,
): R {
	let value = {} as Record<K, ReturnType<F>>

	for (let v of key) {
		value[v] = handle(source[v]) as ReturnType<F>

	}

	return { ...clone(source), ...value } as R

}


export class Transform {
	static date<T extends object = object, K extends keyof T = keyof T>(
		source: T,
		...name: Array<K>

	): PropertyTransformResult<T, Date, K> {
		return transform(
			source,

			name,

			(v): Date => {
				if (detective.is_required_string(v)
					|| detective.is_timestamp_number(v)

				) {
					v = new Date(v)

				}

				if (v instanceof Date && v.valueOf() > 0) {
					return v

				}

				return new Date()

			},


		)


	}

}