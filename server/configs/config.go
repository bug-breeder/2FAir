package configs

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		log.Printf("Could not load .env file: %v", err)
	}
}

func GetEnv(key string) string {
	return os.Getenv(key)
}
