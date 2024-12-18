import pinyin from 'pinyin'


/**
 * 拼音首字母校验规则
 */
export const match = /^[a-zA-Z#]{1}$/


/**
 * 首字母模型
 */
export const schema = {
	type: String,
	required: true,
	uppercase: true,
	trim: true,
	validate: match,

	set(value: string): string {
		return transform(value)

	},

}


/**
 * 转化为拼音首字母
 */
export function transform(value: string): string {
	const p = pinyin.default(
		value,

		{
			style: 'FIRST_LETTER',

		},

	)

	const [letter] = p[0]?.[0] ?? '#'

	return match.test(letter) ? letter : '#'

}