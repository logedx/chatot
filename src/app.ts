import url from 'node:url'
import path from 'node:path'

import morgan from 'morgan'
import express from 'express'
import compression from 'compression'

import * as std from './std.js'

import * as reply from './router/reply.js'






type Package = { default: { name: string, version: string } }

export type HandlerBundle = Array<express.Router | express.Handler | express.ErrorRequestHandler>


const __cwd = process.cwd()

const __cert_dirname = path.resolve(__cwd, 'cert')
const __config_dirname = path.resolve(__cwd, 'config')

const __key_name = 'key'
const __key_filename = path.resolve(__cert_dirname, __key_name)

const __pem_name = 'pem'
const __pem_filename = path.resolve(__cert_dirname, __pem_name)


const __package_filename = url.pathToFileURL(
	path.resolve(__cwd, 'package.json'),

	// { windows: process.platform === 'win32' },

)

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const _package_: Package = await import(
	__package_filename.href, { with: { type: 'json' } },

)




export const name = _package_.default.name

export const name_of_art_font = await std.retrieve_art_font_from_readme(__cwd)

export const version = _package_.default.version

export const cwd = __cwd

export const cert_dirname = __cert_dirname

export const config_dirname = __config_dirname

export const key_name = __key_name

export const key_filename = __key_filename

export const pem_name = __pem_name

export const pem_filename = __pem_filename

export const base_behavior_bundle: HandlerBundle = [
	compression(),
	express.json(),

	morgan(
		':method :status :response-time ms\n - :url\n - :date[iso] ⊶ :remote-addr ⊶ :req[x-request-id]\n',

		{ skip: () => process.env.NODE_ENV === 'test' },

	) as express.Handler,

	reply.cors,

	reply.stdio,
	reply.issue,

]

export const abnormal_feedback_bundle: HandlerBundle = [
	reply.not_found,
	reply.finish,

]


export function create (...bundle: HandlerBundle): express.Application
{
	const app = express()

	app.use(
		...base_behavior_bundle, ...bundle, ...abnormal_feedback_bundle,

	)

	return app


}
