/* eslint-disable */
const app = require('./app')
app.listen(3000, () => {
   try {
     console.log('Server listening on port 3000')
   } catch (error) {
        console.log('Error starting server: ', error)
   }
})  
