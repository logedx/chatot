import chalk from 'chalk'

import * as inquirer from '@inquirer/prompts'

import * as app from '../app.js'
import * as std from '../std.js'

import * as detective from '../lib/detective.js'

import * as weapp_model from '../model/weapp.js'






function * steps(): Generator<void, void, string> {
	const canvas = std.draw(app.name_of_art_font, app.version)

	console.info(
		`\n\n${chalk.green(canvas)}`,

	)

	console.info(
		`\n\n${chalk.green('>')} Please follow the prompts`,

	)

	yield

	console.info(`\n\n${chalk.green('√')} Register is complete!`)


}


async function careate(): Promise<void> {
	let doc = {
		appid: await inquirer.input(
			{
				message: 'App ID:',
				validate: (v: string) => (/^wx[0-9a-f]{16}$/).test(v),

			},

		),

		bucket: await inquirer.input(
			{
				message: `Media storage: ${chalk.gray('Bucket')}`,
				validate: (v: string) => (/^[0-9a-z]+$/).test(v),

			},

		),

		secret: await inquirer.input(
			{
				message: `Weixin App: ${chalk.gray('Secret')}`,
				validate: (v: string) => (/^[0-9a-f]{32}$/).test(v),

			},

		),


	}


	await weapp_model.default.create(doc)


}



export async function run(): Promise<void> {
	const step = steps()

	try {
		step.next()

		await careate()

		step.next()

	}

	catch (e) {
		if (detective.is_error(e)

		) {
			console.error(`\n${chalk.red(e.message)}\n`)

		}

	}



}