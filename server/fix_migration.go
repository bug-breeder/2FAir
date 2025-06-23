package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

func main() {
	connStr := "host=ep-lingering-firefly-a1ddtnm9-pooler.ap-southeast-1.aws.neon.tech port=5432 user=neondb_owner password=npg_IUcf4vkrYK0h dbname=neondb sslmode=require"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Create goose version table if it doesn't exist
	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS goose_db_version (
		id serial NOT NULL,
		version_id bigint NOT NULL,
		is_applied boolean NOT NULL,
		tstamp timestamp NULL DEFAULT now(),
		PRIMARY KEY (id)
	)`)
	if err != nil {
		log.Fatal("Failed to create goose table:", err)
	}

	// Insert version 1 as applied
	_, err = db.Exec(`INSERT INTO goose_db_version (version_id, is_applied, tstamp) VALUES (1, true, $1) ON CONFLICT DO NOTHING`, time.Now())
	if err != nil {
		log.Fatal("Failed to insert version:", err)
	}

	fmt.Println("Successfully marked migration 001 as applied")
}
