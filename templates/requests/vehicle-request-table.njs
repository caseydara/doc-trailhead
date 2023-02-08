<form hx-put="/rest/opo/vehiclerequest/{{ vehiclerequest_id }}/approve"
      hx-target=this
      hx-swap=outerHTML>
  <div class=table-status-row>
    <h2 id=vehicle-request>Vehicle Request (#{{ vehiclerequest_id }})</h2>
    {{ vehiclerequest_badge }}
  </div>
  <h3>Request Notes</h3>
  <p class="user-text">{{ vehiclerequest_details }}
  {% for vehicle in requested_vehicles %}
  <h3>Vehicle #{{ loop.index }}</h3>
  <div class=dual-table-container>
  <dl class=vehicle-table>
    <dt>Vehicle Type<dd>{{ vehicle.type }}
    <dt>Details<dd>{{ vehicle.details }}
    <dt>Pickup Time<dd>{{ vehicle.pickup_time }}
    <dt>Return Time<dd>{{ vehicle.return_time }}
    <dt>Trailer Hitch<dd>{{ vehicle.trailer_needed }}
    <dt>WMNF Pass<dd>{{ vehicle.pass_needed }}
  </dl>
  <dl class=vehicle-table>
  {%if is_opo %}
    <dt><label for="vehicle-{{ loop.index }}">Assigned Vehicle</label></dt>
    <dd>
      <select id="vehicle-{{ loop.index }}"
              name="vehicle-{{ loop.index }}"
              {% if vehiclerequest_is_approved != null %}disabled{% endif %}
              autocomplete=off
              required
              >
        {% for v in available_vehicles %}
        <option {% if v.id === vehicle.id %}selected {% endif %}value="{{v.id}}">{{v.name}}</option>
        {% endfor %}
      </select>
    </dd>
    <dt><label for="key-{{ loop.index }}">Assigned Key #</label></dt>
    <dd><input id="key-{{ loop.index }}"
               name="key-{{ loop.index }}"
               type=text
               value="{{ vehicle.vehicle_key }}"
               {% if vehiclerequest_is_approved != null %}disabled{% endif %}
               autocomplete=off
               required></dd>
    <dt><label for="pickup-{{ loop.index }}">Assigned Pickup</label></dt>
    <dd>
      <input min="{{ today }}"
             id="pickup-{{ loop.index }}"
             name="pickup-{{ loop.index }}"
             value="{{ vehicle.assigned_pickup_time }}"
             type=datetime-local
             {% if vehiclerequest_is_approved != null %}disabled{% endif %}
             autocomplete=off
             required
             >
    </dd>
    <dt>Assigned Return</dt>
    <dd><input min="{{ today }}"
               id="return-{{ loop.index }}"
               name="return-{{ loop.index }}"
               value="{{ vehicle.assigned_return_time }}"
               type=datetime-local
               {% if vehiclerequest_is_approved != null %}disabled{% endif %}
               autocomplete=off
               required
               >
    </dd>

  {% else %}
    <dt>Assigned Vehicle<dd>{{ vehicle.name }}
    <dt>Assigned Key #<dd>{{ vehicle.vehicle_key }}
    <dt>Assigned Pickup<dd>{{ vehicle.pickup_time }}
    <dt>Assigned Return<dd>{{ vehicle.return_time }}
  {% endif %}
  </dl>
  </div>
  {% endfor %}

  {% if is_opo %}
  <div class=button-row>
    <button class="action deny" type=button hx-put="/rest/opo/vehiclerequest/{{ vehiclerequest_id }}/deny">Deny</button>
    {% if vehiclerequest_is_approved !== null %}
    <button class="action edit" type=button hx-put="/rest/opo/vehiclerequest/{{ vehiclerequest_id }}/reset">Un-approve</button>
    {% else %}
    <button class="action approve" type=submit>Assign Vehicles</button>
    {% endif %}
  </div>
  {% endif %}
</form>
