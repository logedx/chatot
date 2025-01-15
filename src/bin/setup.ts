import path from 'node:path'
import fs from 'node:fs/promises'
import child_process from 'node:child_process'

import chalk from 'chalk'

import * as inquirer from '@inquirer/prompts'

import * as app from '../app.js'
import * as std from '../std.js'

import * as secret from '../lib/secret.js'
import * as detective from '../lib/detective.js'




type NodeEnv = 'test' | 'development' | 'production'





function * steps(): Generator<void, void, string> {
	const canvas = std.draw(app.name_of_art_font, app.version)

	console.info(
		`\n\n${chalk.green('>')} Please follow the prompts`,

	)

	console.info(
		`\n\n${chalk.green('>')} ${yield}`,

	)

	console.info(
		`\n\n${chalk.green('>')} ${yield}`,

	)

	yield

	console.info(`


${chalk.green('√')} Setup is complete!








${canvas}


      How To get started:

          ${chalk.cyan('$')} ${chalk.green('npm run release')}

      OR:

          ${chalk.cyan('$')} ${chalk.green('npm run build:image')}




`)

}




async function import_https_certificate(): Promise<void> {
	async function validate(v: string): Promise<boolean> {
		try {
			let stat = await fs.stat(v)

			return stat.isFile() && stat.size > 0

		}

		catch {
			// 

		}

		return false


	}


	let key_filename_ = await inquirer.input(
		{
			message: `Https Certificate: ${chalk.gray('KEY')}`,
			default: app.key_filename,
			validate,

		},

	)

	let pem_filename_ = await inquirer.input(
		{
			message: `Https Certificate: ${chalk.gray('PEM')}`,
			default: app.pem_filename,
			validate,

		},

	)

	let key = await fs.readFile(key_filename_)
	let pem = await fs.readFile(pem_filename_)



	await write_file(key, app.key_filename)
	await write_file(pem, app.pem_filename)

}


async function open_ssl_create_https_certificate(): Promise<null | number> {
	const cp = child_process.spawn(
		'openssl',

		[
			'req', '-x509',
			'-out', 'pem',
			'-keyout', 'key',
			'-newkey', 'rsa:2048',
			'-nodes', '-sha256',
		],

		{ cwd: app.cert_dirname, stdio: 'inherit' },

	)

	return new Promise(
		resolve => {
			cp.on('close', code => {
				resolve(code)
			})

		},

	)

}


async function manually_configure_application(node_env: NodeEnv): Promise<void> {
	let host = await inquirer.input(
		{
			message: 'Host URL: ',
			validate: (v: string) => (/^https?:\/\/[\w-]+(\.[\w-]+)*(:\d+)?\/$/).test(v),
			default: 'https://www.logedx.com/',

		},

	)

	let salt = await inquirer.input(
		{
			message: 'Encryption Salt: ',
			validate: (v: string) => (/^[0-9a-zA-Z]{32}$/).test(v),
			default: secret.hex(),

		},

	)

	let mongodb = await inquirer.input(
		{
			message: `Mongodb Connection String URI: ${chalk.gray('user:password@host:port/database')}`,
			transformer: (v: string) => v.startsWith('mongodb://') ? v : `mongodb://${v}`,
			validate: (v: string) => (/^mongodb:\/\/([0-9a-z]+(:[0-9a-z.!#$%^&*()[\]{}\-=_+]+)?@)?[0-9a-z-_]+(\.[0-9a-z-_]+)*(:\d+)?\/[0-9a-z#]+/).test(v),
			default: `mongodb://localhost:27017/${app.name}#${node_env}#`,

		},

	)

	let aliopen = {
		endpoint: await inquirer.input(
			{
				message: `ALI Cloud Open API: ${chalk.gray('Endpoint')}`,
				validate: (v: string) => (/^[a-z]{2}-[a-z]+(-[0-9a-z]+)?$/).test(v),
				default: 'cn-shenzhen',

			},

		),

		access_key_id: await inquirer.input(
			{
				message: `ALI Cloud Open API: ${chalk.gray('Access Key Id')}`,
				validate: (v: string) => (/^$|^[0-9a-zA-Z]{24}$/).test(v),

			},

		),

		secret_access_key: await inquirer.input(
			{
				message: `ALI Cloud Open API: ${chalk.gray('Secret Access Key')}`,
				validate: (v: string) => (/^$|^[0-9a-zA-Z]{30}$/).test(v),

			},

		),

	}

	let wxopen = {
		app_id: await inquirer.input(
			{
				message: `Weixin Open Platform: ${chalk.gray('App ID')}`,
				validate: (v: string) => (/^$|^wx[0-9a-f]{16}$/).test(v),

			},

		),

		aes_key: await inquirer.input(
			{
				message: `Weixin Open Platform: ${chalk.gray('AES Key')}`,
				validate: (v: string) => (/^$|^[0-9a-f]{32}$/).test(v),

			},

		),

		app_secret: await inquirer.input(
			{
				message: `Weixin Open Platform: ${chalk.gray('App Secret')}`,
				validate: (v: string) => (/^$|^[0-9a-f]{32}$/).test(v),

			},

		),

	}


	let ctx = JSON.stringify(
		{ host, salt, mongodb, aliopen, wxopen },

		null,

		'	',

	)

	let config_filename = path.resolve(app.config_dirname, `${node_env}.json`)

	await write_file(ctx, config_filename)

}


async function write_file(ctx: string | Buffer, filename: string): Promise<void> {
	let file = await fs.open(filename, 'w', 0o755)

	await file.writeFile(ctx)

	await file.close()

}



export async function run(): Promise<void> {
	const step = steps()

	try {
		step.next()

		let node_env = await inquirer.select<NodeEnv>(
			{
				message: 'Choose deployment environment.',
				choices: [{ value: 'test' }, { value: 'development' }, { value: 'production' }],
				default: 'test',
			},

		)

		let how_to_install_https_certificate = await inquirer.select<'create' | 'import' | 'none'>(
			{
				message: 'How to install the https certificate?',
				choices: [{ value: 'create' }, { value: 'import' }, { value: 'none' }],
				default: 'create',

			},
		)


		if (how_to_install_https_certificate === 'create') {
			step.next('Use OpenSSL to create a localhost security certificate')

			await open_ssl_create_https_certificate()

		}

		else if (how_to_install_https_certificate === 'import') {
			step.next('Import the https certificate according to the file')

			await import_https_certificate()

		}

		else {
			step.next('No need to install the https certificate')

		}


		let is_manually_configure_application = await inquirer.confirm(
			{
				message: 'Whether to manually configure the application?',
				default: true,

			},

		)

		if (is_manually_configure_application) {
			step.next('Manually configure the application')

			await manually_configure_application(node_env)

		}

		else {
			step.next('No need to configure the application')

		}


		step.next()

	}

	catch (e) {
		if (detective.is_error(e)

		) {
			console.error(`\n${chalk.red(e.message)}\n`)

		}

	}



}