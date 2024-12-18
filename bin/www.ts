import * as app from '../src/app.js'

import * as www from '../src/bin/www.js'



await www.run(
	app.create(),

)