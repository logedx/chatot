import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs/promises'

import chalk from 'chalk'
import express from 'express'

import * as app from '../app.js'
import * as std from '../std.js'




function listen
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(port: number): (...arg: any[]) => void
{
	return function on_listening (this: unknown): void
	{
		const canvas = std.draw(app.name_of_art_font, app.version).trim()

		const protocol = ['http', 'https'][Number(this instanceof https.Server)]


		console.info(`


  ${canvas}

  ${chalk.cyan('$')} Port: ${chalk.green(`${port}`)}
  ${chalk.cyan('$')} Protocol: ${chalk.green(protocol)}
  ${chalk.cyan('$')} Running at IPv6: ${chalk.green(`${protocol}://[::1]:${port}/`)}
  ${chalk.cyan('$')} Running at IPv4: ${chalk.green(`${protocol}://127.0.0.1:${port}/`)}


`)

	}

}

function error_exit
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(port: number): (...arg: any[]) => never
{
	return function on_error (e: NodeJS.ErrnoException): never
	{
		if (e.code === 'EACCES')
		{
			console.error(
				chalk.red(`\n× Permission denied`),

			)

			process.exit(0)

		}

		if (e.code === 'EADDRINUSE')
		{
			console.error(
				chalk.red(`\n× Port ${port} is already in use`),

			)

			process.exit(0)

		}

		throw e

	}

}


async function read_file (name: string): Promise<Buffer>
{
	let x = name.toLowerCase()
	let y = name.toUpperCase()


	try
	{
		return await Promise.any(
			[
				fs.readFile(
					path.resolve(app.cert_dirname, x),

				),

				fs.readFile(
					path.resolve(app.cert_dirname, y),

				),

			],

		)

	}

	catch (e)
	{
		console.group()

		for (let z of (e as AggregateError).errors)
		{
			console.warn(
				chalk.gray( (z as NodeJS.ErrnoException).message),

			)

		}

		console.groupEnd()

		throw new Error(`${name} is not found`)

	}


}

async function create_server
(_app: express.Application): Promise<http.Server | https.Server>
{
	console.info()

	console.info(
		chalk.italic(`≥ Create HTTPS Server...`),

	)

	let settle = await Promise.allSettled(
		[read_file(app.key_name), read_file(app.pem_name)],

	)

	if (settle.every(v => v.status === 'fulfilled') )
	{
		let [key, cert] = settle.map(
			(v: PromiseFulfilledResult<Buffer>) => v.value,

		)

		return https.createServer(
			{ key, cert },

			_app,

		)

	}

	console.info()


	for (let e of settle.filter(v => v.status === 'rejected') )
	{
		console.error(
			chalk.red(`× ${e.reason}`),

		)

	}

	console.info()
	console.info()
	console.info()
	console.info()

	console.info(
		chalk.italic('≥ Create HTTP server...'),

	)


	return http.createServer(_app)


}


export async function run
(_app: express.Application, _port = Number(process.env?.PORT ?? 3000) ): Promise<void>
{
	const server = await create_server(_app)

	server.on(
		'listening', listen(_port),

	)

	server.on(
		'error', error_exit(_port),

	)

	server.listen(_port)

}
