package main

import (
	"github.com/bug-breeder/2fair/server/configs"

	_ "github.com/bug-breeder/2fair/server/docs" // This is important for the Swagger docs to be generated
)

// @title 2FAir API
// @version 1.0
// @description This is the API documentation for the 2FAir application.
// @termsOfService http://swagger.io/terms/

// @contact.name Andy Nguyen
// @contact.url http://www.2fair.vip/support
// @contact.email anhngw@gmail.com

// @license.name GNU General Public License v3.0
// @license.url https://www.gnu.org/licenses/gpl-3.0.en.html

// @host localhost:8080
// @BasePath /
func main() {
	configs.LoadEnv()
	runServer()
}
