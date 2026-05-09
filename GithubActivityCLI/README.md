# Github Activity CLI

Một công cụ dòng lệnh (CLI) viết bằng Go giúp lấy và hiển thị lịch sử hoạt động (PushEvent) gần nhất của một người dùng GitHub.

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
go build -o github-activity

# 3. Chuyển binary vào đường dẫn hệ thống để gọi được ở bất cứ đâu
sudo mv github-activity /usr/local/bin/
```

## Hướng dẫn sử dụng
Chạy CLI bằng cách gọi trực tiếp tên lệnh kèm theo username của tài khoản GitHub bạn muốn kiểm tra:

```Bash
github-activity <username>
```

### Ví dụ:
```Bash
github-activity thangdaudau
```

### Kết quả hiển thị mẫu:

```Plaintext
[2026-04-26T10:01:19Z] thangdaudau Pushed a commit to theducminh/RAG_Pineline
[2026-04-23T13:30:39Z] thangdaudau Pushed a commit to thangdaudau/TensorTonic-Solutions
```