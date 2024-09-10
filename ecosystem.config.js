module.exports = [{
	  script: './dist/bin/www.js',
	  name: 'smile-api',
	  exec_mode: 'cluster',
	  instances: 'max',
	//env_production: {
	//	      'NODE_APP_INSTANCE': 3
	//	    }
}]
