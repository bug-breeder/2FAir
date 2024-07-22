package main

import (
	"github.com/bug-breeder/2fair/server/configs"
	"github.com/bug-breeder/2fair/server/internal/server"
)

func main() {
	configs.LoadEnv()
	server.Run()
}
