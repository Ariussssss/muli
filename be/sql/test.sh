sql="
SELECT name, printf('%.2f MB', SUM(pgsize) / (1024.0 * 1024.0)) AS size_mb FROM dbstat
GROUP BY NAME
"
sql="
SELECT * FROM DOWNLOAD
LIMIT 10
"
# sql="
# SELECT * FROM PLAYLIST
# LIMIT 10
# "
sqlite3 $(dirname $(realpath "$0"))/../muli.sqlite3.db <<EOF
$sql
EOF
