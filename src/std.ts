import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'




export function draw(name: Array<string>, version: string, _indent = 2): string {
	return `${indent(name, _indent)} v${version}`

}


export function indent(text: Array<string>, value = 0): string {
	return text
		.map(
			v => v.padStart(value + v.length, ' '),

		)
		.join('\n')

}


export async function retrieve_art_font(filename: string): Promise<Array<string>> {
	try {
		let font: Array<string> = []

		let file = await fs.open(filename)


		for await (let v of file.readLines()

		) {
			if (v.startsWith('```app:name')

			) {
				font.push(v)

				continue

			}


			if (font.length > 0) {
				font.push(v)

			}

			if (v.startsWith('```')

			) {
				break

			}


		}

		return font.slice(1, -1)

	}

	catch {
		return []

	}

}

export async function retrieve_art_font_from_readme(dir: string): Promise<Array<string>> {
	let font = await retrieve_art_font(
		path.resolve(dir, 'README.md'),

	)

	if (font.length > 0) {
		return font

	}

	return retrieve_art_font(
		path.resolve(url.fileURLToPath(import.meta.url), '..', 'README.md'),

	)

}