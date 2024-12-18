# 令牌接口


## 创建令牌

> /token


### Request
 - url: `/token`
 - method: `POST`
 - header:
	```http
	Content-Type: application/json
	```

### Response

<details>
<summary>success</summary>

- status: `200`

- header:
	```http
	Content-Type: application/json
	```

- body:
	```ts
	type Body = {
		"value": string, // 令牌值
		"refresh": string, // 刷新令牌值
		"expire": string, // 过期时间
	}
	```
</details>

<details>
<summary>error</summary>

- status: `40x`
- header:
	```http
	Content-Type: application/json
	```

- body:
	```ts
	type Body = {
		"name": string, // 错误名称
		"message": string, // 错误信息
		"stack": string[] // 错误堆栈
	}
	```
</details>

### Example

<details>
<summary>success</summary>

```http
POST https://example.com/token HTTP/1.1
Content-Type: application/json

--response--------------------
HTTP/1.1 200 OK
Content-Type: application/json


{ "value": "64d9e1da6b4b0d1baebcaec3", "refresh": "64d9e1da6b4b0d1baebcaec3", "expire": "2024-01-01T00:00:00.000Z" }


```
</details>

<details>
<summary>error</summary>

```http
POST https://example.com/token HTTP/1.1
Content-Type: application/json

--response--------------------
HTTP/1.1 401 Unauthorized
Content-Type: application/json


{ "name": "Unauthorized", "message": "authentication failed", "stack": [] }


```
</details>


## 查询凭证

> /token


### Request
 - url: `/token`
 - method: `GET`
 - header:
	```http
	Content-Type: application/json
	Authorization: Toekn ${string}
	```

### Response

<details>
<summary>success</summary>

- status: `200`

- header:
	```http
	Content-Type: application/json
	```

- body:
	```ts
	type Body = {
		"expire": string, // 过期时间
		"scope": string[], // 权限范围
	}
	```
</details>

<details>
<summary>error</summary>

- status: `40x`
- header:
	```http
	Content-Type: application/json
	```

- body:
	```ts
	type Body = {
		"name": string, // 错误名称
		"message": string, // 错误信息
		"stack": string[] // 错误堆栈
	}
	```
</details>

### Example

<details>
<summary>success</summary>

```http
GET https://example.com/token HTTP/1.1
Content-Type: application/json
Authorization: Toekn 64dacec16b4b0d1baebcbf72

--response--------------------
HTTP/1.1 200 OK
Content-Type: application/json


{ "expire": "2024-01-01T00:00:00.000Z" }


```
</details>

<details>
<summary>error</summary>

```http
GET https://example.com/token HTTP/1.1
Content-Type: application/json
Authorization: Toekn 64dacec16b4b0d1baebcbf72

--response--------------------
HTTP/1.1 401 Unauthorized
Content-Type: application/json


{ "name": "Unauthorized", "message": "authentication failed", "stack": [] }


```
</details>


## 刷新凭证

> /token


### Request
 - url: `/token`
 - method: `PUT`
 - header:
	```http
	Content-Type: application/json
	Authorization: Token ${string}
	```

### Response

<details>
<summary>success</summary>

- status: `200`

- header:
	```http
	Content-Type: application/json
	```

- body:
	```ts
	type Body = {
		expire: string, // 过期时间
		refresh: string, // 刷新凭证
	}
	```
</details>

<details>
<summary>error</summary>

- status: `40x`
- header:
	```http
	Content-Type: application/json
	```

- body:
	```ts
	type Body = {
		"name": string, // 错误名称
		"message": string, // 错误信息
		"stack": string[] // 错误堆栈
	}
	```
</details>

### Example

<details>
<summary>success</summary>

```http
PUT https://example.com/token HTTP/1.1
Content-Type: application/json
Authorization: Toekn 64dacec16b4b0d1baebcbf72

--response--------------------
HTTP/1.1 200 OK
Content-Type: application/json


{ "refresh": "64dacec16b4b0d1baebcbf72", "expire": "2021-01-01T00:00:00.000Z" }


```
</details>

<details>
 <summary>error</summary>

```http
PUT https://example.com/token HTTP/1.1
Content-Type: application/json
Authorization: Toekn 64dacec16b4b0d1baebcbf72

--response--------------------
HTTP/1.1 401 Unauthorized
Content-Type: application/json


{ "name": "Unauthorized", "message": "authentication failed", "stack": [] }


```
</details>