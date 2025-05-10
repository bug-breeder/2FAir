package models

type Issuer struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Website        string `json:"website"`
	HelpURL        string `json:"help_url"`
	ImageURI       string `json:"image_uri"`
	Digits         int    `json:"digits"`
	Period         int    `json:"period"`
	DefaultCounter int    `json:"default_counter"`
	Algorithm      string `json:"algorithm"`
	Method         string `json:"method"`
}
