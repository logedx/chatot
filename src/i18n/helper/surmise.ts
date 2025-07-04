/* eslint-disable @typescript-eslint/naming-convention */
import * as i18n from '../../lib/i18n.js'

import zh_cn_dossier from '../zh-cn/surmise/dossier.json' with { type: 'json' }



export enum Dossier
{
	'failed to get any data',
	'${key} is not exist',
	'key is invalid',
	'infer fail',
	'is not a object',
	'symbol is not a object key',


}


export const dossier = new i18n.Helper(
	Dossier, { 'zh-cn': zh_cn_dossier },

)
