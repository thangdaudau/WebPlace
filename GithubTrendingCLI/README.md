# Github Activity CLI

Ứng dụng CLI hỗ trợ theo dõi các dự án (repositories) đang hot trên GitHub theo thời gian thực.

Dữ liệu được lấy trực tiếp bằng cách phân tích cú pháp HTML từ trang GitHub Trending chính thức.

## Yêu cầu hệ thống (Prerequisites)

Nếu hệ thống chưa cài đặt Go, chạy cụm lệnh sau (dành cho Linux AMD64 - đéo có thì cài WSL):

```bash
# 1. Tải Go bản 1.26.3
wget [https://go.dev/dl/go1.26.3.linux-amd64.tar.gz](https://go.dev/dl/go1.26.3.linux-amd64.tar.gz)

# 2. Xóa bản cũ (nếu có) và giải nén bản mới vào /usr/local
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.26.3.linux-amd64.tar.gz

# 3. Cập nhật biến môi trường vào ~/.profile
echo 'export GOROOT=/usr/local/go' >> ~/.profile
echo 'export GOPATH=$HOME/go' >> ~/.profile
echo 'export PATH=$PATH:$GOROOT/bin:$GOPATH/bin' >> ~/.profile

# 4. Áp dụng thay đổi và kiểm tra
source ~/.profile
go version
```

## Hướng dẫn Build và Cài đặt
Mở terminal tại thư mục gốc của dự án (nơi chứa file go.mod) và chạy cụm lệnh sau:

```Bash
# 1. Tải các dependencies cần thiết
go mod tidy

# 2. Biên dịch mã nguồn thành file thực thi
go build -o github-trending

# 3. Chuyển binary vào đường dẫn hệ thống để gọi được ở bất cứ đâu
sudo mv github-trending /usr/local/bin/
```

## Hướng dẫn sử dụng
Chạy CLI bằng cách gọi trực tiếp tên lệnh kèm theo flags:

```Bash
github-trending --duration [daily, weekly, monthly] --limit [1 -> khoảng 15-20]
```

### Ví dụ:
```Bash
github-trending --duration weekly --limit 5
```

### Kết quả hiển thị mẫu:

```Plaintext
[1] harry0703/MoneyPrinterTurbo (Python)
    URL:         https://github.com/harry0703/MoneyPrinterTurbo
    Description: 利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM.
    Total Stars: 73,016 | Forks: 10,430
    Growth:      13,948 stars this week
------------------------------------------------------------
[2] Lum1104/Understand-Anything (TypeScript)
    URL:         https://github.com/Lum1104/Understand-Anything
    Description: Graphs that teach > graphs that impress. Turn any code into an interactive knowledge graph you can explore, search, and ask questions about. Works with Claude Code, Codex, Cursor, Copilot, Gemini CLI, and more.
    Total Stars: 46,602 | Forks: 3,781
    Growth:      25,612 stars this week
------------------------------------------------------------
[3] anthropics/knowledge-work-plugins (Python)
    URL:         https://github.com/anthropics/knowledge-work-plugins
    Description: Open source repository of plugins primarily intended for knowledge workers to use in Claude Cowork
    Total Stars: 18,336 | Forks: 2,154
    Growth:      5,538 stars this week
------------------------------------------------------------
[4] rohitg00/ai-engineering-from-scratch (Python)
    URL:         https://github.com/rohitg00/ai-engineering-from-scratch
    Description: Learn it. Build it. Ship it for others.
    Total Stars: 25,411 | Forks: 4,120
    Growth:      12,082 stars this week
------------------------------------------------------------
[5] hardikpandya/stop-slop ()
    URL:         https://github.com/hardikpandya/stop-slop
    Description: A skill file for removing AI tells from prose
    Total Stars: 7,575 | Forks: 534
    Growth:      3,543 stars this week
------------------------------------------------------------
```