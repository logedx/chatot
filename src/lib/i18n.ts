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

	map (lang: L, text: string): void
	{
		this.#local[lang] = text

	}

	local (lang: 'en' | L): string
	{
		if (lang === 'en')
		{
			return this.#default

		}

		for (let v of lang.toLocaleLowerCase().split(',') )
		{
			if (v === 'en')
			{
				return this.#default

			}

			if (detective.is_required_string(this.#local[v]) )
			{
				return this.#local[v]

			}

		}

		return this.#default

	}


}


export class Helper
<T extends object, L extends Language = never>
{
	#map: T

	#lang: Record<string, Record<string, string> >

	constructor
	(
		map: T,
		// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
		lang?: { [k in L]?: { [m in keyof T & string]: string } },

	)
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

		for (let [k, v] of Object.entries(this.#lang) )
		{
			message.map(
				k as Exclude<L, void>,

				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				this.#replace(v[text] ?? '', ...ctx),

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
		let m = `${text}`

		if (detective.is_object_keyof(this.#map, text) )
		{
			m = this.#map[text] as string

		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return this.#translate(m, ...ctx)

	}


}
