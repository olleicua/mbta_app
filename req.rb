#!/usr/bin/env ruby
# writes new stops.js file and outputs it to stdout as well

require 'net/http'
require 'rubygems'
require 'json'

def get path
  url = URI.parse(path)
  req = Net::HTTP::Get.new(path)
  res = Net::HTTP.start(url.host, url.port) {|http|
    http.request(req)
  }
  res.body
end

routesXML = get 'http://webservices.nextbus.com/service/publicXMLFeed?command=routeList&a=mbta'
routes = routesXML.scan(/tag="([^"]+)"/).flatten

stops = {};

routes.each do |r|
  sleep 11
  STDERR.puts "#{r}.."
  begin
    stopsXML = get "http://webservices.nextbus.com/service/publicXMLFeed?command=routeConfig&a=mbta&r=#{r}"
    stopsTags = stopsXML.scan(/<stop tag="[^"]*" title="[^"]*" lat="[^"]*" lon="[^"]*" stopId="[^"]*"\/>/)
  
    stopsTags.each do |stopTag|
      id = /stopId="([^"]+)"/.match(stopTag)[1]
      stops[id] = {
        :id => id,
        :lat => /lat="([^"]+)"/.match(stopTag)[1],
        :lon => /lon="([^"]+)"/.match(stopTag)[1],
        :title => /title="([^"]+)"/.match(stopTag)[1]
      }
    end
  rescue
    STDERR.puts "An error occurred for in route #{r}"
  end
end

puts JSON.dump stops.values

f = open 'stops.js', 'w'
f.write ('var stops = ' + JSON.dump(stops.values))
