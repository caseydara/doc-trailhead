<table class=trip-table hx-target=this hx-swap=outerHTML>
<thead><tr><th>Person<th>Attendance</tr></thead>
<tbody>
{% for member in members %}
<tr>
  <td>{{member.name}}
  <td>
    {% if member.attended %}
    <button
      class="action deny"
      hx-delete="/rest/trip/{{trip_id}}/present/{{member.id}}"
      >Mark Absent
    </button>
    {% else %}
    <button
      class="action approve"
      hx-put="/rest/trip/{{trip_id}}/present/{{member.id}}"
      >Mark Present
    </button>
    {% endif %}
</tr>
{%endfor %}
</tbody>
</table>
</section>

