import * as detective from './detective.js'




export type Language = 'zh-cn'


export class Speech<L extends Language = never>
{
	#default: string

	#local: Record<string, string> = {}

	constructor (text: string)
	{
		this.#default = text

	}

	get default (): string
	{
		return this.#default

	}

	local (lang: L): string

	local (lang: 'default' | L, text: string): void

	// eslint-disable-next-line consistent-return
	local (lang: 'default' | L, text?: string): string | void
	{
		if (detective.is_required_string(text) === false)
		{
			let [v] = lang.toLocaleLowerCase().split(',')

			return this.#local[v] ?? this.#default

		}

		if (lang === 'default')
		{
			this.#default = text

			// eslint-disable-next-line consistent-return
			return

		}


		this.#local[lang] = text



	}


}


export class Helper
<
	T extends object,
	L extends Language = never,

	// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
	M extends { [m in keyof T & string]: string } = { [m in keyof T & string]: string },

>
{
	#map: T

	#lang: Record<string, M>

	// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
	constructor (map: T, lang?: { [k in L]?: M })
	{
		this.#map = map
		this.#lang = { ...lang }

	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#translate (text: string, ...ctx: any[]): Speech<L>
	{
		let message = new Speech<L>(
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
			this.#replace(text, ...ctx),

		)

		for (let [k, v] of Object.entries<M>(this.#lang) )
		{
			message.local(
				k as Exclude<L, void>,

				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				this.#replace(v[text as keyof M] ?? '', ...ctx),

			)

		}

		return message

	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#replace (text: string, ...ctx: any[]): string
	{
		return text.replace(
			/\$\{([^}]+)\}/g,

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			(match, index) => ctx[Number(index)] ?? match,

		)

	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	t (text: keyof T, ...ctx: any[]): Speech<L>
	{
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return this.#translate(text as string, ...ctx)

	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	n (text: number, ...ctx: any[]): Speech<L>
	{
		let text_ = `${text}`

		if (detective.is_object_keyof(this.#map, text) )
		{
			text_ = this.#map[text] as string

		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return this.#translate(text_, ...ctx)

	}


}
