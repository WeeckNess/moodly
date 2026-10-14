export default (plugin: any) => {
  plugin.contentTypes.user.schema.attributes.team = {
    type: 'relation', relation: 'manyToOne', target: 'api::team.team',
  };
  return plugin;
};
