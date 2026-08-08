/**
 * 小程序
 */
import * as schema from '../lib/schema.js'




export type Default = schema.Define<
	{
		appid : string
		bucket: string

		secret  : schema.Types.Sensitive<string>
		mchid   : schema.Types.Sensitive<string>
		v3key   : schema.Types.Sensitive<string>
		sign    : schema.Types.Sensitive<string | ArrayBuffer>
		evidence: schema.Types.Sensitive<string | ArrayBuffer>
		verify  : schema.Types.Sensitive<string | ArrayBuffer>
		token   : schema.Types.Sensitive<string>
		refresh : schema.Types.Sensitive<string>
		expired : schema.Types.Sensitive<null | Date>

		closed: Date

	},

	{
		api_v3_option: schema.Types.Sensitive<
			{
				mchid   : string
				v3key   : string
				sign    : string | ArrayBuffer
				evidence: string | ArrayBuffer
				verify  : string | ArrayBuffer

			}

		>

	}

>
