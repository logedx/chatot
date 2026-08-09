import * as detective from './detective.js'




export type Language = 'en' | 'zh-cn'


export class Speech<L extends Language = 'en'>
{
	#default: string

	#local: Record<string, string> = {}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	#ctx: any[] = []


	constructor (text: string)
	{
		this.#default = text

	}

	map (lang: L, text: string): void
	{
		this.#local[lang] = text

	}

	with (...ctx: any[]): this
	{
		this.#ctx = ctx

		return this

	}

	local (lang: 'en' | L): string
	{
		if (lang === 'en')
		{
			return this.#replace(this.#default)

		}

		for (let v of lang.toLocaleLowerCase().split(',') )
		{
			if (v === 'en')
			{
				return this.#replace(this.#default)

			}

			if (detective.is_required_string(this.#local[v]) )
			{
				return this.#replace(this.#local[v])

			}

		}

		return this.#replace(this.#default)

	}

	#replace (text: string): string
	{
		let regex = /\$\{(\d+)\}/g

		if (regex.test(text) === false)
		{
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			return [...this.#ctx, text].join(' ')

		}

		return text.replace(
			regex,

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			(match, index) => this.#ctx[Number(index)] ?? match,

		)

	}

}


export class Helper
<T extends object, L extends Language = 'en'>
{
	#map: T

	#lang: Record<string, Record<string, string> >


	constructor
	(
		map: T,
		// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
		lang?: { [k in L]: { [m in keyof T & string]: string } },

	)
	{
		this.#map = map
		this.#lang = { ...lang }

	}


	#translate (text: string, ...ctx: any[]): Speech<L>
	{
		let message = new Speech<L>(text)

		for (let [k, v] of Object.entries(this.#lang) )
		{
			message.map(k as L, v[text] ?? '')

		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return message.with(...ctx)

	}


	t (text: keyof T, ...ctx: any[]): Speech<L>
	{
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		return this.#translate(text as string, ...ctx)

	}


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
