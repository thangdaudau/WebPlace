/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "github-activity [username]",
	Short: "A brief description of your application",
	Long: `A longer description that spans multiple lines and likely contains
examples and usage of using your application. For example:

Cobra is a CLI library for Go that empowers applications.
This application is a tool to generate the needed files
to quickly create a Cobra application.`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	Args: cobra.ExactArgs(1),
	Run: func(cmd *cobra.Command, args []string) {
		username := args[0]
		resp, err := http.Get(fmt.Sprintf("https://api.github.com/users/%s/events", username))
		if err != nil {
			panic(err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			panic(resp.Status)
		}

		type RespBody struct {
			ID    string `json:"id"`
			Type  string `json:"type"`
			Actor struct {
				Login string `json:"login"`
			} `json:"actor"`
			Repo struct {
				Name string `json:"name"`
			} `json:"repo"`
			CreatedAt string `json:"created_at"`
		}

		var jbodys []RespBody
		bruh := json.NewDecoder(resp.Body).Decode(&jbodys)
		if bruh != nil {
			panic(bruh)
		}
		for _, ev := range jbodys {
			if ev.Type == "PushEvent" {

				green := "\033[32m"
				blue := "\033[34m"
				yellow := "\033[33m"
				reset := "\033[0m"

				fmt.Printf(
					"%s[%s]%s %s %sPushed%s a commit to %s%s%s\n",
					yellow, ev.CreatedAt, reset,
					ev.Actor.Login,
					green, reset,
					blue, ev.Repo.Name, reset,
				)
			}
		}
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	// Here you will define your flags and configuration settings.
	// Cobra supports persistent flags, which, if defined here,
	// will be global for your application.

	// rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.github-activity.yaml)")

	// Cobra also supports local flags, which will only run
	// when this action is called directly.
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
}
