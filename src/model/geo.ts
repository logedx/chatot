import { Schema } from 'mongoose'


import * as database from '../store/database.js'




export type TmPoint = database.Tm<
	{
		type       : string
		coordinates: [number, number]

	},

	{
		longitude: number
		latitude : number

	}

>


// Don't do `{ location: { type: String } }`
// 'location.type' must be 'Point'
export const point: TmPoint['TSchema'] = new Schema
<
	TmPoint['DocType'],
	TmPoint['TModel'],
	TmPoint['TInstanceMethods'],
	TmPoint['TQueryHelpers'],
	TmPoint['TVirtuals'],
	TmPoint['TStaticMethods']


>(
	{
		type: {
			type    : String,
			required: true,
			trim    : true,
			enum    : ['Point'],
			default : 'Point',

		},

		coordinates: {
			type    : [Number],
			required: true,

		},

	},

)

point.virtual('longitude').get(
	function (): TmPoint['TVirtuals']['longitude']
	{
		let [v] = this.coordinates

		return v


	},

)

point.virtual('latitude').get(
	function (): TmPoint['TVirtuals']['latitude']
	{
		let [, v] = this.coordinates

		return v

	},

)
