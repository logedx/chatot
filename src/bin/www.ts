import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs/promises'

import chalk from 'chalk'
import express from 'express'

import * as app from '../app.js'
import * as std from '../std.js'




// eslint-disable-next-line @typescript-eslint/no-explicit-any
function listen(port: number): (...arg: Array<any>) => void {
	return function on_listening(this: unknown): void {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function error(port: number): (...arg: Array<any>) => never {
	return function on_error(e: NodeJS.ErrnoException): never {
		if (e.code === 'EACCES') {
			console.error(
				chalk.red(`\n× Permission denied`),

			)

			process.exit(0)

		}

		if (e.code === 'EADDRINUSE') {
			console.error(
				chalk.red(`\n× Port ${port} is already in use`),

			)

			process.exit(0)

		}

		throw e

	}

}


function read_file(filename: string): Promise<Buffer> {
	let x = filename.toUpperCase()
	let y = filename.toLowerCase()

	for (let v of [x, y]) {
		try {
			return fs.readFile(
				path.resolve(app.cert_dirname, v),

			)


		}

		catch {
			// 

		}

	}

	throw new Error('File not exist')

}

async function create_server(_app: express.Application): Promise<http.Server | https.Server> {
	try {
		const key = await read_file('key')
		const cert = await read_file('crt')


		return https.createServer(
			{ key, cert },

			_app,

		)

	}

	catch {
		return http.createServer(_app)

	}

}


export async function run(
	_app: express.Application,
	_port = Number(process.env?.PORT ?? 3000),

): Promise<void> {
	const server = await create_server(_app)

	server.on(
		'listening', listen(_port),

	)

	server.on(
		'error', error(_port),

	)

	server.listen(_port)

}