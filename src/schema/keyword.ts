/**
 * 关键字
 */
import * as schema from '../lib/schema.js'

import * as weapp from './weapp.js'





export type Letter =	| 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
						| 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N'
						| 'O' | 'P' | 'Q' | 'R' | 'S' | 'T'
						| 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'


export type Default = schema.Define<
	{
		weapp : schema.Types.Ref<weapp.Default>

		name  : string
		color : string
		value : schema.Types.Keyword<string>
		letter: Letter

	},

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	{}

>
