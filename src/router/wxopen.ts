import express from 'express'

import { Parser } from 'xml2js'

import * as wxopen from '../lib/wxopen.js'


const parser = new Parser(
	// eslint-disable-next-line @typescript-eslint/naming-convention
	{ trim: true, explicitArray: false, explicitRoot: false },

)

export const router = express.Router()

/**
 * 微信第三方平台消息应答
 */
router.post(
	'/wxopen',

	express.text(
		{ type: '*/xml' },

	),

	async function update(req, res) {
		type BodyParse = {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Encrypt: string
		}

		type Result = {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			InfoType: string
			// eslint-disable-next-line @typescript-eslint/naming-convention
			ComponentVerifyTicket: string
		}

		try {
			let body = await parser.parseStringPromise(req.body as string) as BodyParse

			let decrypt = wxopen.WXBizMsgCrypt.decrypt(body.Encrypt)

			let result = await parser.parseStringPromise(decrypt) as Result

			switch (result.InfoType) {

				// 验证票据
				case 'component_verify_ticket': {
					wxopen.set_component_verify_ticket(result.ComponentVerifyTicket)

					break

				}

				// 创建小程序审核结果
				case 'notify_third_fasteregister':

				// 授权成功
				// eslint-disable-next-line no-fallthrough
				case 'authorized':

				// 更新授权
				// eslint-disable-next-line no-fallthrough
				case 'updateauthorized':

				// 取消授权
				// eslint-disable-next-line no-fallthrough
				case 'unauthorized': {
					break

				}


			}

			res.end('success')

		}

		catch (e) {
			res.stdio(e)

			res.end('fail')

		}

	},

)
