<form class="profile-card"
      action=/rest/profile
      method=post
      hx-boost=true
      hx-target=this
      hx-swap=outerHTML
      hx-push-url=false
>
<section class=profile-overview>
  <div class=profile-photo></div>
  <div class=profile-name>
    <input type=text name=name value="{{ name }}" required>
    <input type=text name=email value="{{ email }}" required class=email-row>
  </div>
</section>
<section>
<dl>
  <dt>Pronouns<dd><input type=text name=pronouns value="{{ pronoun }}">
  <dt>DASH<dd><input type=text name="dash_number" value="{{ dash_number }}">
  <dt>Clothing Size<dd>
      <select name="clothe_size" value="{{ clothe_size }}">
        <option{% if clothe_size == 'Women-XS' %} selected{% endif %}>Women-XS
        <option{% if clothe_size == 'Women-S' %} selected{% endif %}>Women-S
        <option{% if clothe_size == 'Women-M' %} selected{% endif %}>Women-M
        <option{% if clothe_size == 'Women-L' %} selected{% endif %}>Women-L
        <option{% if clothe_size == 'Women-XL' %} selected{% endif %}>Women-XL
        <option{% if clothe_size == 'Men-XS' %} selected{% endif %}>Men-XS
        <option{% if clothe_size == 'Men-S' %} selected{% endif %}>Men-S
        <option{% if clothe_size == 'Men-M' %} selected{% endif %}>Men-M
        <option{% if clothe_size == 'Men-L' %} selected{% endif %}>Men-L
        <option{% if clothe_size == 'Men-XL' %} selected{% endif %}>Men-XL
      </select>
  <dt>Shoe Size<dd>
      <select name="shoe_size_sex">
        <option{% if shoe_size_sex == 'Men' %} selected{% endif %}>Men
        <option{% if shoe_size_sex == 'Women' %} selected{% endif %}>Women
      </select>
      <input type=number name="shoe_size_num" value="{{ shoe_size_num }}">
  <dt>Height<dd><input type=text name="height" value="{{ height }}">
  <dt>Allergies/Dietary Restrictions<dd><input type=text name="allergies_dietary_restrictions" value="{{ allergies_dietary_restrictions }}">
  <dt>Medical Conditions<dd><input type=text name="medical_conditions" value="{{ medical_conditions }}">
</dl>
</section>
<section>
<div class=button-row>
  <button class="action deny" hx-get="/rest/profile">Cancel</button>
  <button class="action approve" type=submit>Save</button>
</div>
</section>
</form>
