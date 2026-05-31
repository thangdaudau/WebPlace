/*
Copyright © 2026 NAME HERE <EMAIL ADDRESS>
*/
package cmd

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "github-trending",
	Short: "Cào và hiển thị danh sách các kho mã nguồn (repositories) đang thịnh hành trên GitHub",
	Long: `Ứng dụng CLI hỗ trợ theo dõi các dự án (repositories) đang hot trên GitHub theo thời gian thực.
Dữ liệu được lấy trực tiếp bằng cách phân tích cú pháp HTML từ trang GitHub Trending chính thức.

Tính năng:
- Lọc theo khoảng thời gian (ngày, tuần, tháng) thông qua flag --duration.
- Giới hạn số lượng kết quả hiển thị (tối đa 19) thông qua flag --limit.

Ví dụ sử dụng:
# Xem các repo hot nhất hôm nay (mặc định lấy 1 repo)
github-trending

# Xem top 10 repo hot nhất trong tuần này
github-trending --duration weekly --limit 10

# Xem top 5 repo tiếng tăm nhất trong tháng qua
github-trending --duration monthly --limit 5`,
	// Uncomment the following line if your bare application
	// has an action associated with it:
	Run: func(cmd *cobra.Command, args []string) {
		// Đọc và validate flags từ user
		duration, _ := cmd.Flags().GetString("duration")
		limit, _ := cmd.Flags().GetInt8("limit")

		if duration != "daily" && duration != "weekly" && duration != "monthly" {
			duration = "daily" // fallback default phòng hờ user truyền bậy
		}
		if limit < 1 {
			limit = 1
		}

		// Gửi request kèm param duration động
		url := fmt.Sprintf("https://github.com/trending?since=%s", duration)
		resp, err := http.Get(url)
		if err != nil {
			panic(fmt.Sprintf("Failed to fetch data: %v", err))
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			panic(fmt.Sprintf("GitHub returned bad status: %d", resp.StatusCode))
		}

		// Load HTML body vào goquery Document thay vì đọc ra []rune
		doc, err := goquery.NewDocumentFromReader(resp.Body)
		if err != nil {
			panic(fmt.Sprintf("Failed to parse HTML: %v", err))
		}

		var count int8 = 0

		type RepoTrending struct {
			Name        string
			URL         string
			Description string
			Language    string
			Stars       string
			Forks       string
			StarsGrowth string
		}
		// Bóc tách dữ liệu theo CSS Selector dựa trên block HTML bạn đưa
		doc.Find("article.Box-row").Each(func(i int, s *goquery.Selection) {
			// Check limit, đạt giới hạn thì dừng loop
			if count >= limit {
				return
			}

			// Bóc tên Repo và URL (H2 > a)
			aTitle := s.Find("h2.h3 a")
			repoURL, _ := aTitle.Attr("href")
			// Trích xuất text, xóa khoảng trắng thừa thãi (\n, spaces)
			rawTitle := aTitle.Text()
			repoName := strings.Join(strings.Fields(rawTitle), "")

			// Bóc Description (Thẻ p)
			desc := strings.TrimSpace(s.Find("p.col-9").Text())

			// Bóc Ngôn ngữ lập trình
			lang := strings.TrimSpace(s.Find("[itemprop='programmingLanguage']").Text())

			// Bóc Stars & Forks (Dựa vào href của các thẻ <a> bên dưới)
			stars := ""
			forks := ""
			s.Find("div.f6 a").Each(func(j int, anchor *goquery.Selection) {
				href, _ := anchor.Attr("href")
				if strings.Contains(href, "/stargazers") {
					stars = strings.TrimSpace(anchor.Text())
				} else if strings.Contains(href, "/forks") {
					forks = strings.TrimSpace(anchor.Text())
				}
			})

			// Bóc số lượng star tăng trong ngày/tuần/tháng (Nằm ở góc phải dưới cùng của block)
			// Selector này tìm span chứa text "stars today" hoặc tương tự tùy thuộc duration
			starsText := ""
			s.Find("div.f6 span.d-inline-block.float-sm-right").Each(func(j int, span *goquery.Selection) {
				starsText = strings.TrimSpace(span.Text())
			})

			// Build object và in kết quả ra màn hình
			repo := RepoTrending{
				Name:        repoName,
				URL:         "https://github.com" + repoURL,
				Description: desc,
				Language:    lang,
				Stars:       stars,
				Forks:       forks,
				StarsGrowth: starsText,
			}

			count++

			// Đổ dữ liệu ra CLI
			fmt.Printf("[%d] %s (%s)\n", count, repo.Name, repo.Language)
			fmt.Printf("    URL:         %s\n", repo.URL)
			fmt.Printf("    Description: %s\n", repo.Description)
			fmt.Printf("    Total Stars: %s | Forks: %s\n", repo.Stars, repo.Forks)
			fmt.Printf("    Growth:      %s\n", repo.StarsGrowth)
			fmt.Println(strings.Repeat("-", 60))
		})
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

	// rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.github-trending.yaml)")

	// Cobra also supports local flags, which will only run
	// when this action is called directly.
	rootCmd.Flags().BoolP("toggle", "t", false, "Help message for toggle")
	rootCmd.Flags().String("duration", "weekly", "daily | weekly | monthly")
	rootCmd.Flags().Int8("limit", 5, "[1 -> khoảng 15-20]")
}
