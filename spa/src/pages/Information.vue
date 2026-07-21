<template>
  <div>
    <div class="h-full w-full bg-black flex flex-col"
         style="padding: 10px"
         v-if="$route.params.slug === 'jail'">
      <div v-for="(job, index) in securityInfo" :key="index">
        <div class="pb-2.5" v-if="job.length > 0">
          <p>
            {{ index }}<br/>
          </p>
          <ul>
            <li v-for="name in job" :key="name">
              <span class="text-chat cursor-pointer underline"
                    v-on:click="opener(`/home/${name}`)">{{ name }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="h-full w-full bg-black flex flex-col" style="padding: 10px" v-else>
      <div>
        Leader<br/>
        <span style="color: #00df00; text-decoration: underline; cursor: pointer;"
              v-on:click="opener('/home/'+owner)">{{ owner }}
        </span>
      </div>
      <div style="padding-top: 10px">
        <p>Deputies</p>
        <ul>
          <li v-for="deputy in deputies" :key="deputy.username || deputy">
            <span style="color: #00df00; text-decoration: underline; cursor: pointer"
                  v-on:click="opener('/home/'+(deputy.username || deputy))">
            {{ deputy.username || deputy }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  name: "InformationPage",
  data: () => {
    return {
      owner: null,
      deputies: [],
      securityInfo: {},
    };
  },
  methods: {
    async getData(): Promise<void> {
      let infopoint = null;
      switch (this.$route.params.type) {
      case "block":
        infopoint = `/block/${
          this.$route.params.id
        }/getAccessInfo/`;
        break;
      case "hood":
        infopoint = `/hood/${
          this.$route.params.id
        }/getAccessInfo/`;
        break;
      case "colony":
        infopoint = `/colony/${
          this.$route.params.id
        }/getAccessInfo/`;
        break;
      case "public": {
        if (this.$route.params.slug === "jail") {
          infopoint = "/place/getSecurityInfo";
        } else {
          infopoint = `/place/getAccessInfo/${this.$route.params.slug}/${this.$route.params.id}`;
        }
        break;
      }
      case "shop": {
        infopoint = "/place/getAccessInfo/mall";
        break;
      }
      case "club": {
        infopoint = `/place/getAccessInfo/personalclub/${this.$route.params.id}`;
        break;
      }
      default:
        break;
      }
      this.$http.get(infopoint).then((response) => {
        if (this.$route.params.slug === "jail") {
          this.securityInfo = response.data.securityInfo;
        }
        else {
          if (response.data.data && response.data.data.owner && response.data.data.owner.length !== 0) {
            this.owner = response.data.data.owner[0].username;
          } else {
            this.owner = "N/A";
          }
          if (response.data.data && response.data.data.deputies) {
            response.data.data.deputies.forEach((username, index) => {
              this.deputies[index] = username;
            });
          }
        }
      });
      return;
    },
    async opener(link: string): Promise<void> {
      const cleanLink = link.startsWith('#') ? link.substring(1) : link;
      if (window.opener && !window.opener.closed) {
        window.opener.location.href = cleanLink;
        window.close();
      } else {
        this.$router.push(cleanLink);
      }
    },
  },
  mounted() {
    this.getData();
  },
});
</script>
