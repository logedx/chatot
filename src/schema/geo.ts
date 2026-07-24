import * as schema from '../lib/schema.js'




export type Point = schema.Define<
	{
		type       : string
		coordinates: [number, number]

	},

	{
		longitude: number
		latitude : number

	}

>
